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
  
  // Calculate where the scene starts in the full content (character position)
  let sceneStartPosition = 0;
  for (let i = 0; i < sceneStartLine; i++) {
    sceneStartPosition += lines[i].length + 1; // +1 for newline
  }
  
  // Calculate cursor position relative to scene start
  const cursorInScene = cursorPosition - sceneStartPosition;
  
  // Extract LIMITED context window around cursor (before and after)
  // This gives AI enough context to understand the scene without seeing the full scene
  // BEFORE: 150 chars (2-3 lines - just enough for continuity, not enough to repeat)
  // AFTER: 200 chars (just to see what comes next)
  // CRITICAL: Exclude scene heading from context - AI shouldn't see it to repeat it
  let contextBeforeCursor = cursorInScene > 0
    ? sceneContent.substring(Math.max(0, cursorInScene - 150), cursorInScene).trim()
    : '';
  
  // Remove scene heading from contextBeforeCursor if present
  // Scene headings are at the start of sceneContent, so if we're near the start, remove it
  // Reuse sceneHeadingRegex declared above (line 33)
  if (contextBeforeCursor) {
    const lines = contextBeforeCursor.split('\n');
    // Remove scene heading if it's in the context
    contextBeforeCursor = lines.filter(line => !sceneHeadingRegex.test(line.trim())).join('\n').trim();
  }
  
  const contextAfterCursor = cursorInScene >= 0 && cursorInScene < sceneContent.length
    ? sceneContent.substring(cursorInScene, Math.min(sceneContent.length, cursorInScene + 200)).trim()
    : '';

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
    content: sceneContent, // Full scene content (for reference)
    contextBeforeCursor: contextBeforeCursor || '', // Limited context before cursor (~400 chars)
    contextAfterCursor: contextAfterCursor || '', // Limited context after cursor (~200 chars)
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

/**
 * Extracts the scene immediately before the current scene
 * @param {string} content - Full screenplay content
 * @param {number} currentSceneStartLine - Line number where current scene starts
 * @returns {Object|null} Previous scene with content, heading, and characters, or null if no previous scene
 */
export function extractPreviousScene(content, currentSceneStartLine) {
  if (!content || currentSceneStartLine === undefined || currentSceneStartLine <= 0) {
    return null;
  }

  const lines = content.split('\n');
  const sceneHeadingRegex = /^(INT\.|EXT\.|INT\/EXT\.|I\/E\.)\s+/i;

  // Find the scene heading before currentSceneStartLine
  let previousSceneStartLine = -1;
  let previousSceneHeading = null;

  for (let i = currentSceneStartLine - 1; i >= 0; i--) {
    if (sceneHeadingRegex.test(lines[i])) {
      previousSceneStartLine = i;
      previousSceneHeading = lines[i].trim();
      break;
    }
  }

  // If no previous scene found, return null
  if (previousSceneStartLine === -1) {
    return null;
  }

  // Find the end of the previous scene (current scene start - 1)
  const previousSceneEndLine = currentSceneStartLine - 1;

  // Extract previous scene content
  const previousSceneLines = lines.slice(previousSceneStartLine, previousSceneEndLine + 1);
  const previousSceneContent = previousSceneLines.join('\n');

  // Extract characters from previous scene
  const characters = extractCharacters(previousSceneContent);

  return {
    heading: previousSceneHeading,
    content: previousSceneContent,
    characters: characters,
    startLine: previousSceneStartLine,
    endLine: previousSceneEndLine
  };
}

/**
 * Extracts the last N dialogue exchanges from scene content
 * @param {string} sceneContent - Full scene content
 * @param {number} count - Number of dialogue exchanges to extract (default: 5)
 * @returns {Array<{character: string, line: string}>} Array of dialogue exchanges
 */
export function extractRecentDialogue(sceneContent, count = 5) {
  if (!sceneContent) return [];

  const lines = sceneContent.split('\n');
  const dialogueExchanges = [];
  const characterRegex = /^([A-Z][A-Z\s#0-9']+)$/;
  const nonCharacterWords = ['INT', 'EXT', 'FADE', 'CUT', 'DISSOLVE', 'TO', 'BLACK', 'CONTINUED', 'THE END', 'I/E', 'INT/EXT'];

  let currentCharacter = null;
  let currentDialogue = [];

  // Parse scene content to find character-dialogue pairs
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check if line is a character name (ALL CAPS, not a scene heading)
    if (characterRegex.test(line)) {
      const trimmed = line.trim();
      const isSceneHeading = /^(INT\.|EXT\.|INT\/EXT\.|I\/E\.)\s+/i.test(trimmed);
      const isNonCharacter = nonCharacterWords.some(word => trimmed.startsWith(word));
      
      if (!isSceneHeading && !isNonCharacter && trimmed.length >= 2 && trimmed.length <= 30) {
        // Save previous dialogue exchange if exists
        if (currentCharacter && currentDialogue.length > 0) {
          dialogueExchanges.push({
            character: currentCharacter,
            line: currentDialogue.join(' ').trim()
          });
        }
        
        // Start new dialogue exchange
        currentCharacter = trimmed;
        currentDialogue = [];
      }
    } else if (currentCharacter && line.length > 0) {
      // This is dialogue following a character name
      // Skip parentheticals (lines in parentheses)
      if (!line.startsWith('(') || !line.endsWith(')')) {
        currentDialogue.push(line);
      }
    }
  }

  // Add final dialogue exchange if exists
  if (currentCharacter && currentDialogue.length > 0) {
    dialogueExchanges.push({
      character: currentCharacter,
      line: currentDialogue.join(' ').trim()
    });
  }

  // Return last N exchanges
  return dialogueExchanges.slice(-count);
}

/**
 * Extracts action lines from scene content (non-dialogue, non-character content)
 * @param {string} sceneContent - Full scene content
 * @returns {Array<string>} Array of action lines
 */
export function extractSceneAction(sceneContent) {
  if (!sceneContent) return [];

  const lines = sceneContent.split('\n');
  const actionLines = [];
  const sceneHeadingRegex = /^(INT\.|EXT\.|INT\/EXT\.|I\/E\.)\s+/i;
  const characterRegex = /^([A-Z][A-Z\s#0-9']+)$/;
  const nonCharacterWords = ['INT', 'EXT', 'FADE', 'CUT', 'DISSOLVE', 'TO', 'BLACK', 'CONTINUED', 'THE END', 'I/E', 'INT/EXT'];

  let isInDialogue = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line) continue;

    // Skip scene headings
    if (sceneHeadingRegex.test(line)) continue;

    // Check if line is a character name
    if (characterRegex.test(line)) {
      const trimmed = line.trim();
      const isSceneHeading = /^(INT\.|EXT\.|INT\/EXT\.|I\/E\.)\s+/i.test(trimmed);
      const isNonCharacter = nonCharacterWords.some(word => trimmed.startsWith(word));
      
      if (!isSceneHeading && !isNonCharacter && trimmed.length >= 2 && trimmed.length <= 30) {
        isInDialogue = true;
        continue;
      }
    }

    // Check if line is dialogue (following a character name)
    if (isInDialogue) {
      // Check if this is a parenthetical (in parentheses)
      if (line.startsWith('(') && line.endsWith(')')) {
        continue; // Skip parentheticals
      }
      // If line doesn't look like dialogue continuation, we've left the dialogue block
      if (line.length > 0 && !line.match(/^[a-z]/)) {
        isInDialogue = false;
      } else {
        continue; // Skip dialogue lines
      }
    }

    // This is an action line
    if (line.length > 0) {
      actionLines.push(line);
    }
  }

  return actionLines;
}

