/**
 * Screenplay Context Tracker
 * 
 * Parses fountain format content to extract context information
 * (current scene, characters, etc.) for cross-page navigation
 */

/**
 * Parse scene at cursor position
 */
export function parseSceneAtCursor(content: string, cursorPosition: number) {
  const lines = content.split('\n');
  let currentPos = 0;
  let currentSceneStart = -1;
  let currentSceneLine = -1;
  let sceneHeading = null;
  
  // Find current scene
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineLength = line.length + 1; // +1 for newline
    
    // Check if this is a scene heading
    if (isSceneHeading(line)) {
      currentSceneStart = i;
      currentSceneLine = currentPos;
      sceneHeading = line;
    }
    
    // Check if cursor is in this line
    if (currentPos <= cursorPosition && cursorPosition < currentPos + lineLength) {
      // Found the line containing cursor
      break;
    }
    
    currentPos += lineLength;
  }
  
  if (!sceneHeading) return null;
  
  // Parse scene heading
  const parsed = parseSceneHeading(sceneHeading);
  
  return {
    id: `scene-${currentSceneStart}`,
    heading: sceneHeading,
    startLine: currentSceneStart,
    location: parsed.location,
    timeOfDay: parsed.timeOfDay,
    type: parsed.type,
  };
}

/**
 * Check if line is a scene heading
 */
function isSceneHeading(line: string): boolean {
  const trimmed = line.trim();
  return /^(INT|EXT|INT\.|EXT\.|INT\.\/EXT|INT\/EXT|I\/E)[\.\s]/i.test(trimmed);
}

/**
 * Parse scene heading into components
 */
function parseSceneHeading(heading: string) {
  const match = heading.match(/^(INT|EXT|INT\.|EXT\.|INT\.\/EXT|INT\/EXT|I\/E)[\.\s]+(.+?)\s*-\s*(.+)$/i);
  
  if (!match) {
    return {
      type: 'INT',
      location: heading.replace(/^(INT|EXT|INT\.|EXT\.|INT\.\/EXT|INT\/EXT|I\/E)[\.\s]+/i, '').trim(),
      timeOfDay: 'DAY',
    };
  }
  
  return {
    type: match[1].toUpperCase().replace('.', ''),
    location: match[2].trim(),
    timeOfDay: match[3].trim().toUpperCase(),
  };
}

/**
 * Extract characters from current scene
 */
export function extractCharactersInScene(content: string, sceneStartLine: number): string[] {
  const lines = content.split('\n');
  const characters = new Set<string>();
  
  let currentLine = sceneStartLine + 1;
  
  // Read until next scene or end
  while (currentLine < lines.length) {
    const line = lines[currentLine];
    
    // Stop at next scene
    if (isSceneHeading(line)) break;
    
    // Check if this is a character name (all caps, possibly with parenthetical)
    const trimmed = line.trim();
    if (trimmed && isCharacterName(trimmed)) {
      const charName = trimmed.split('(')[0].trim();
      characters.add(charName);
    }
    
    currentLine++;
  }
  
  return Array.from(characters);
}

/**
 * Check if line is a character name
 */
function isCharacterName(line: string): boolean {
  // Character names are all caps and typically followed by dialogue or parenthetical
  return /^[A-Z][A-Z\s'.]+(\(|$)/.test(line) && line.length < 50 && !isSceneHeading(line);
}

/**
 * Extract all unique characters from content
 */
export function extractAllCharacters(content: string): string[] {
  const lines = content.split('\n');
  const characters = new Set<string>();
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && isCharacterName(trimmed) && !isSceneHeading(trimmed)) {
      const charName = trimmed.split('(')[0].trim();
      if (charName && charName !== charName.toLowerCase()) {
        characters.add(charName);
      }
    }
  }
  
  return Array.from(characters);
}

/**
 * Extract all unique locations from content
 */
export function extractAllLocations(content: string): string[] {
  const lines = content.split('\n');
  const locations = new Set<string>();
  
  for (const line of lines) {
    if (isSceneHeading(line)) {
      const parsed = parseSceneHeading(line);
      if (parsed.location) {
        locations.add(parsed.location);
      }
    }
  }
  
  return Array.from(locations);
}

/**
 * Find all scenes in content
 */
export function findAllScenes(content: string) {
  const lines = content.split('\n');
  const scenes = [];
  
  lines.forEach((line, index) => {
    if (isSceneHeading(line)) {
      const parsed = parseSceneHeading(line);
      scenes.push({
        id: `scene-${index}`,
        heading: line,
        startLine: index,
        location: parsed.location,
        timeOfDay: parsed.timeOfDay,
        type: parsed.type,
      });
    }
  });
  
  return scenes;
}

/**
 * Get line number from cursor position
 */
export function getCursorLine(content: string, cursorPosition: number): number {
  const textBeforeCursor = content.substring(0, cursorPosition);
  return textBeforeCursor.split('\n').length - 1;
}

