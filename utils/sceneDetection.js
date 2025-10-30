/**
 * Scene Detection Utility
 * Extracts scene context from screenplay content and cursor position
 */

/**
 * Detects the current scene based on cursor position in the screenplay
 * @param {string} content - Full screenplay content
 * @param {number} cursorPosition - Current cursor position
 * @returns {Object} Scene context with heading, act, characters, and content
 */
export function detectCurrentScene(content, cursorPosition) {
  if (!content || cursorPosition === undefined) {
    return null;
  }

  const lines = content.split('\n');
  let currentLine = 0;
  let charCount = 0;

  // Find which line the cursor is on
  for (let i = 0; i < lines.length; i++) {
    charCount += lines[i].length + 1; // +1 for newline
    if (charCount >= cursorPosition) {
      currentLine = i;
      break;
    }
  }

  // Find the last scene heading before cursor
  let sceneHeading = null;
  let sceneStartLine = 0;
  const sceneHeadingRegex = /^(INT\.|EXT\.|INT\/EXT\.|I\/E\.)\s+/i;

  for (let i = currentLine; i >= 0; i--) {
    if (sceneHeadingRegex.test(lines[i])) {
      sceneHeading = lines[i].trim();
      sceneStartLine = i;
      break;
    }
  }

  // Find the next scene heading (end of current scene)
  let sceneEndLine = lines.length - 1;
  for (let i = currentLine + 1; i < lines.length; i++) {
    if (sceneHeadingRegex.test(lines[i])) {
      sceneEndLine = i - 1;
      break;
    }
  }

  // Extract scene content
  const sceneLines = lines.slice(sceneStartLine, sceneEndLine + 1);
  const sceneContent = sceneLines.join('\n');

  // Extract characters mentioned in scene
  const characters = extractCharacters(sceneContent);

  // Detect act (rough estimate based on page position)
  const totalPages = Math.ceil(lines.length / 55); // ~55 lines per page
  const currentPage = Math.ceil(sceneStartLine / 55);
  const act = detectAct(currentPage, totalPages);

  return {
    heading: sceneHeading || 'Unknown Scene',
    act: act,
    characters: characters,
    content: sceneContent,
    startLine: sceneStartLine,
    endLine: sceneEndLine,
    currentLine: currentLine,
    pageNumber: currentPage,
    totalPages: totalPages
  };
}

/**
 * Extracts character names from scene content
 * @param {string} sceneContent - Content of the scene
 * @returns {Array<string>} List of character names
 */
function extractCharacters(sceneContent) {
  const characterRegex = /^([A-Z][A-Z\s]+)$/gm;
  const matches = sceneContent.match(characterRegex);
  
  if (!matches) return [];

  // Filter out scene headings and common non-character lines
  const nonCharacterWords = ['INT', 'EXT', 'FADE', 'CUT', 'DISSOLVE', 'TO', 'BLACK', 'CONTINUED', 'THE END'];
  
  const characters = matches
    .filter(match => {
      const trimmed = match.trim();
      // Must be all caps, 2-30 chars
      if (trimmed.length < 2 || trimmed.length > 30) return false;
      // Not a scene heading or transition
      if (nonCharacterWords.some(word => trimmed.startsWith(word))) return false;
      return true;
    })
    .map(match => match.trim());

  // Remove duplicates
  return [...new Set(characters)];
}

/**
 * Estimates which act of the screenplay based on page position
 * @param {number} currentPage - Current page number
 * @param {number} totalPages - Total pages in screenplay
 * @returns {number} Act number (1, 2, or 3)
 */
function detectAct(currentPage, totalPages) {
  const position = currentPage / totalPages;
  
  if (position < 0.25) return 1; // First 25% = Act 1
  if (position < 0.75) return 2; // Middle 50% = Act 2
  return 3; // Last 25% = Act 3
}

/**
 * Extracts selected text context for rewriting
 * @param {string} content - Full content
 * @param {number} selectionStart - Start position of selection
 * @param {number} selectionEnd - End position of selection
 * @returns {Object} Selected text with before/after context
 */
export function extractSelectionContext(content, selectionStart, selectionEnd) {
  if (!content || selectionStart === undefined || selectionEnd === undefined) {
    return null;
  }

  const selectedText = content.substring(selectionStart, selectionEnd);
  
  // Get 100 chars before and after for context
  const beforeContext = content.substring(Math.max(0, selectionStart - 100), selectionStart);
  const afterContext = content.substring(selectionEnd, Math.min(content.length, selectionEnd + 100));

  return {
    selectedText,
    beforeContext,
    afterContext,
    start: selectionStart,
    end: selectionEnd
  };
}

/**
 * Builds a context string for AI prompts
 * @param {Object} sceneContext - Scene context from detectCurrentScene
 * @returns {string} Formatted context string
 */
export function buildContextPrompt(sceneContext) {
  if (!sceneContext) return '';

  let context = `\n\n[SCENE CONTEXT]\n`;
  context += `Scene: ${sceneContext.heading}\n`;
  context += `Act: ${sceneContext.act}\n`;
  context += `Page: ${sceneContext.pageNumber} of ${sceneContext.totalPages}\n`;
  
  if (sceneContext.characters && sceneContext.characters.length > 0) {
    context += `Characters in scene: ${sceneContext.characters.join(', ')}\n`;
  }

  return context;
}

