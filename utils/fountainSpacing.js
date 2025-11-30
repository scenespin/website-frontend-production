/**
 * Fountain Format Spacing Utility
 * 
 * Applies proper Fountain format spacing rules based on official Fountain.io syntax:
 * - Character: blank line BEFORE, NO blank line AFTER
 * - Action → Character: 1 blank line
 * - Character → Dialogue/Parenthetical: NO blank line
 * - Parenthetical → Dialogue: NO blank line
 * - Dialogue → Action/Character: 1 blank line
 * 
 * Reference: https://fountain.io/syntax/
 */

/**
 * Formats content array with proper Fountain spacing
 * @param {string[]} contentArray - Array of lines to format
 * @returns {string} Formatted content with proper spacing
 */
export function formatFountainSpacing(contentArray) {
  if (!Array.isArray(contentArray) || contentArray.length === 0) {
    return '';
  }

  // If array items contain newlines, split them into individual lines
  const expandedArray = [];
  for (const item of contentArray) {
    if (typeof item === 'string' && item.includes('\n')) {
      const lines = item.split('\n').map(l => l.trim()).filter(l => l);
      expandedArray.push(...lines);
    } else {
      expandedArray.push(item);
    }
  }
  contentArray = expandedArray;

  let formattedLines = [];

  for (let i = 0; i < contentArray.length; i++) {
    const line = contentArray[i].trim();
    if (!line) continue;

    const prevLine = i > 0 ? contentArray[i - 1].trim() : '';
    const nextLine = i < contentArray.length - 1 ? contentArray[i + 1].trim() : '';

    // Check if this is a character name (ALL CAPS, not a scene heading, 2-50 chars)
    // EXCLUDE lines that contain lowercase letters (like "SARAH CHEN (30s)" - that's action, not character)
    // EXCLUDE lines that contain parentheses with content (character extensions are on same line as name)
    const isCharacterName = /^[A-Z][A-Z\s#0-9']+$/.test(line) &&
                           line.length >= 2 &&
                           line.length <= 50 &&
                           !/^(INT\.|EXT\.|I\/E\.)/i.test(line) &&
                           !/[a-z]/.test(line) && // No lowercase letters
                           !/\([^)]+\)/.test(line); // No parenthetical content (like "(30s)")

    // Check if this is a parenthetical (wrapped in parentheses)
    const isParenthetical = /^\(.+\)$/.test(line);

    // Check if previous line was character name
    const prevIsCharacterName = prevLine && /^[A-Z][A-Z\s#0-9']+$/.test(prevLine) &&
                                 prevLine.length >= 2 &&
                                 prevLine.length <= 50 &&
                                 !/^(INT\.|EXT\.|I\/E\.)/i.test(prevLine) &&
                                 !/[a-z]/.test(prevLine) &&
                                 !/\([^)]+\)/.test(prevLine);

    // Check if previous line was parenthetical
    const prevIsParenthetical = prevLine && /^\(.+\)$/.test(prevLine);

    // Check if this is dialogue (follows character name or parenthetical)
    const isDialogue = (prevIsCharacterName || prevIsParenthetical) && !isParenthetical && !isCharacterName;

    // Check if this is action (not character name, not dialogue, not parenthetical)
    const isAction = !isCharacterName && !isDialogue && !isParenthetical;

    // Check if next line is character name
    const nextIsCharacterName = nextLine && /^[A-Z][A-Z\s#0-9']+$/.test(nextLine) &&
                                nextLine.length >= 2 &&
                                nextLine.length <= 50 &&
                                !/^(INT\.|EXT\.|I\/E\.)/i.test(nextLine) &&
                                !/[a-z]/.test(nextLine) &&
                                !/\([^)]+\)/.test(nextLine);

    // Check if next line is parenthetical
    const nextIsParenthetical = nextLine && /^\(.+\)$/.test(nextLine);

    // Check if next line is dialogue (follows this character name or parenthetical)
    const nextIsDialogue = (isCharacterName || isParenthetical) && nextLine && !nextIsCharacterName && !nextIsParenthetical;

    // Check if next line is action (not character, not dialogue, not parenthetical)
    const nextIsAction = nextLine && !nextIsCharacterName && !nextIsDialogue && !nextIsParenthetical;

    // FOUNTAIN SPEC: Character has blank line BEFORE, NO blank line AFTER
    // Add blank line BEFORE character name if previous was action
    if (isCharacterName && prevLine && !prevIsCharacterName && !prevIsParenthetical) {
      // Only add if last line in formattedLines is not already empty
      if (formattedLines.length === 0 || formattedLines[formattedLines.length - 1] !== '') {
        formattedLines.push('');
      }
    }

    // Add the line
    formattedLines.push(line);

    // FOUNTAIN SPEC: Action → blank line → Character
    // Don't add blank line here - we add it BEFORE the character to avoid duplicates
    if (isAction && nextIsCharacterName) {
      // Don't add here - the character's "before" logic will handle it
    }
    // FOUNTAIN SPEC: Character → NO blank line → Parenthetical/Dialogue
    // Character has "without an empty line after it" - dialogue/parenthetical follows immediately
    else if (isCharacterName && (nextIsParenthetical || nextIsDialogue)) {
      // No blank line - parenthetical/dialogue follows immediately on next line
    }
    // FOUNTAIN SPEC: Parenthetical → NO blank line → Dialogue
    // Parenthetical flows directly to dialogue
    else if (isParenthetical && nextIsDialogue) {
      // No blank line - dialogue follows immediately on next line
    }
    // FOUNTAIN SPEC: Dialogue → blank line → Action/Character
    // Add blank line AFTER dialogue if next is action or character
    else if (isDialogue && nextLine && (nextIsAction || nextIsCharacterName)) {
      // Only add if last line is not already empty
      if (formattedLines[formattedLines.length - 1] !== '') {
        formattedLines.push('');
      }
    }
  }

  // Join lines with newlines (empty strings create blank lines)
  let formattedContent = formattedLines.join('\n');

  // Normalize excessive blank lines: replace 3+ consecutive newlines with just 2 (one blank line)
  formattedContent = formattedContent.replace(/\n{3,}/g, '\n\n');

  return formattedContent.trim();
}

