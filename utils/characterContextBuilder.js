/**
 * Character Context Builder Utility
 * 
 * Builds character summaries for writing agents (Director, Dialogue, Screenwriter, Rewrite)
 * Provides brief, contextually relevant character information for AI prompts
 */

/**
 * Filters characters to those appearing in the current scene
 * @param {Array<Object>} characters - Array of Character objects from ScreenplayContext
 * @param {Object} sceneContext - Scene context from detectCurrentScene
 * @returns {Array<Object>} Filtered array of Character objects in the scene
 */
export function getCharactersInScene(characters, sceneContext) {
  if (!characters || !Array.isArray(characters) || !sceneContext) {
    return [];
  }

  const sceneCharacterNames = sceneContext.characters || [];
  if (sceneCharacterNames.length === 0) {
    return [];
  }

  // Match character names from scene with Character objects
  // Use case-insensitive matching to handle variations
  const sceneCharacterNamesLower = sceneCharacterNames.map(name => name.toLowerCase().trim());
  
  return characters.filter(char => {
    if (!char || !char.name) return false;
    const charNameLower = char.name.toLowerCase().trim();
    return sceneCharacterNamesLower.includes(charNameLower);
  });
}

/**
 * Builds brief character summaries for writing agents
 * Format: "NAME: Role/Relationship. Current emotional state/context. Key trait relevant to scene."
 * @param {Array<Object>} characters - Array of Character objects (filtered to scene characters)
 * @param {Object} sceneContext - Scene context from detectCurrentScene
 * @returns {string} Formatted character summaries string for prompt inclusion
 */
export function buildCharacterSummaries(characters, sceneContext) {
  if (!characters || !Array.isArray(characters) || characters.length === 0) {
    return '';
  }

  if (!sceneContext) {
    return '';
  }

  const summaries = characters.map(char => {
    if (!char || !char.name) return null;

    const parts = [];

    // Part 1: Role/Relationship
    if (char.type) {
      const typeMap = {
        'lead': 'Protagonist',
        'supporting': 'Supporting character',
        'minor': 'Minor character'
      };
      parts.push(typeMap[char.type] || char.type);
    } else {
      parts.push('Character');
    }

    // Part 2: Current emotional state/context (from arcNotes or description)
    let contextInfo = '';
    if (char.arcNotes) {
      // Extract recent context from arcNotes (last sentence or two)
      const arcSentences = char.arcNotes.split(/[.!?]+/).filter(s => s.trim().length > 0);
      if (arcSentences.length > 0) {
        contextInfo = arcSentences.slice(-2).join('. ').trim();
        if (contextInfo && !contextInfo.endsWith('.')) {
          contextInfo += '.';
        }
      }
    }
    
    if (!contextInfo && char.description) {
      // Use description if no arcNotes
      const descSentences = char.description.split(/[.!?]+/).filter(s => s.trim().length > 0);
      if (descSentences.length > 0) {
        contextInfo = descSentences[0].trim();
        if (contextInfo && !contextInfo.endsWith('.')) {
          contextInfo += '.';
        }
      }
    }

    // Part 3: Key trait relevant to scene (from description)
    let keyTrait = '';
    if (char.description && char.description.length > 0) {
      // Extract key trait (first meaningful sentence from description)
      const descSentences = char.description.split(/[.!?]+/).filter(s => s.trim().length > 10);
      if (descSentences.length > 0) {
        keyTrait = descSentences[0].trim();
        // If we already used description for context, use a different part
        if (contextInfo && descSentences.length > 1) {
          keyTrait = descSentences[1].trim();
        }
        if (keyTrait && !keyTrait.endsWith('.')) {
          keyTrait += '.';
        }
      }
    }

    // Build summary string
    let summary = `${char.name.toUpperCase()}: ${parts.join(', ')}`;
    
    if (contextInfo) {
      summary += ` ${contextInfo}`;
    }
    
    if (keyTrait && keyTrait !== contextInfo) {
      summary += ` ${keyTrait}`;
    }

    return summary;
  }).filter(summary => summary !== null);

  if (summaries.length === 0) {
    return '';
  }

  return summaries.join('\n');
}

