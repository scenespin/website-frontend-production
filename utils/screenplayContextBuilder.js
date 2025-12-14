/**
 * Screenplay Context Builder Utility
 * 
 * Intelligently builds context for Story Advisor based on screenplay length and query type.
 * Implements industry best practices (Cursor/Windsurf style):
 * - Full content for short screenplays (< 50 pages)
 * - Structured summaries for medium screenplays (50-120 pages)
 * - RAG-style retrieval for long screenplays (> 120 pages)
 */

import { detectCurrentScene } from './sceneDetection';
import { calculateMaxContentChars, getModelContextWindow, estimateTokens } from './tokenCalculator';

// Constants
const CHARS_PER_PAGE = 2000; // Rough estimate: ~2000 chars per page
const SHORT_SCREENPLAY_PAGES = 50;
const MEDIUM_SCREENPLAY_PAGES = 120;

/**
 * Main function: Builds intelligent context for Story Advisor
 * @param {string} editorContent - Full screenplay content
 * @param {number} cursorPosition - Current cursor position
 * @param {string} query - User's query (for relevance detection)
 * @param {string} modelId - Selected model ID
 * @param {Array} conversationHistory - Conversation history
 * @param {string} systemPromptBase - Base system prompt (for token calculation)
 * @returns {Object} Context object with type and content
 */
export function buildStoryAdvisorContext(editorContent, cursorPosition, query, modelId, conversationHistory, systemPromptBase) {
  if (!editorContent || editorContent.length === 0) {
    return {
      type: 'empty',
      content: null,
      currentScene: null
    };
  }

  // Calculate screenplay length
  const screenplayLength = editorContent.length;
  const estimatedPages = Math.ceil(screenplayLength / CHARS_PER_PAGE);

  // Detect current scene (always needed)
  const currentScene = detectCurrentScene(editorContent, cursorPosition);

  // Calculate available capacity
  const maxContentChars = calculateMaxContentChars(
    modelId,
    conversationHistory,
    systemPromptBase || '',
    query || ''
  );

  // Determine strategy based on length and capacity
  if (estimatedPages < SHORT_SCREENPLAY_PAGES && screenplayLength <= maxContentChars) {
    // Short screenplay that fits in context window
    return {
      type: 'full',
      content: editorContent,
      currentScene: currentScene,
      estimatedPages: estimatedPages
    };
  } else if (estimatedPages < MEDIUM_SCREENPLAY_PAGES) {
    // Medium screenplay: structured summary + current scene
    const structure = extractScreenplayStructure(editorContent);
    return {
      type: 'structured',
      content: structure,
      currentScene: currentScene,
      estimatedPages: estimatedPages
    };
  } else {
    // Long screenplay: RAG-style retrieval
    const structure = extractScreenplayStructure(editorContent);
    const relevantScenes = retrieveRelevantScenes(editorContent, query, currentScene, maxContentChars);
    return {
      type: 'retrieval',
      content: structure,
      currentScene: currentScene,
      relevantScenes: relevantScenes,
      estimatedPages: estimatedPages
    };
  }
}

/**
 * Extracts screenplay structure (scene headings, characters, act summaries)
 * @param {string} editorContent - Full screenplay content
 * @returns {Object} Structured summary object
 */
export function extractScreenplayStructure(editorContent) {
  const lines = editorContent.split('\n');
  const sceneHeadingRegex = /^(INT\.|EXT\.|INT\/EXT\.|I\/E\.)\s+/i;
  
  // Extract scene headings
  const sceneHeadings = [];
  lines.forEach((line, index) => {
    if (sceneHeadingRegex.test(line.trim())) {
      sceneHeadings.push({
        heading: line.trim(),
        lineNumber: index + 1,
        pageNumber: Math.ceil((index + 1) / 55) // ~55 lines per page
      });
    }
  });

  // Extract all characters from entire screenplay
  const allCharacters = extractAllCharacters(editorContent);

  // Generate act summaries
  const actSummaries = generateActSummaries(editorContent, sceneHeadings);

  return {
    sceneHeadings: sceneHeadings,
    characters: allCharacters,
    actSummaries: actSummaries,
    totalScenes: sceneHeadings.length
  };
}

/**
 * Extracts all characters from screenplay (not just current scene)
 * @param {string} editorContent - Full screenplay content
 * @returns {Array<string>} List of unique character names
 */
function extractAllCharacters(editorContent) {
  const characterRegex = /^([A-Z][A-Z\s#0-9']+)$/gm;
  const matches = editorContent.match(characterRegex);
  
  if (!matches) return [];

  const nonCharacterWords = ['INT', 'EXT', 'FADE', 'CUT', 'DISSOLVE', 'TO', 'BLACK', 'CONTINUED', 'THE END', 'I/E'];
  
  const characters = matches
    .filter(match => {
      const trimmed = match.trim();
      // Must be all caps, 2-50 chars
      if (trimmed.length < 2 || trimmed.length > 50) return false;
      // Not a scene heading or transition
      if (nonCharacterWords.some(word => trimmed.startsWith(word))) return false;
      // Not containing lowercase (like "SARAH CHEN (30s)")
      if (/[a-z]/.test(trimmed)) return false;
      // Not containing parenthetical content
      if (/\([^)]+\)/.test(trimmed)) return false;
      return true;
    })
    .map(match => match.trim());

  // Remove duplicates and sort
  return [...new Set(characters)].sort();
}

/**
 * Generates act summaries (1-2 sentences per act)
 * @param {string} editorContent - Full screenplay content
 * @param {Array} sceneHeadings - Array of scene heading objects
 * @returns {Array<Object>} Act summaries
 */
function generateActSummaries(editorContent, sceneHeadings) {
  if (sceneHeadings.length === 0) {
    return [];
  }

  const totalPages = Math.ceil(editorContent.split('\n').length / 55);
  const lines = editorContent.split('\n');
  
  // Divide into 3 acts
  const act1EndPage = Math.floor(totalPages * 0.25);
  const act2EndPage = Math.floor(totalPages * 0.75);
  
  // Find scene headings in each act
  const act1Scenes = sceneHeadings.filter(s => s.pageNumber <= act1EndPage);
  const act2Scenes = sceneHeadings.filter(s => s.pageNumber > act1EndPage && s.pageNumber <= act2EndPage);
  const act3Scenes = sceneHeadings.filter(s => s.pageNumber > act2EndPage);
  
  // Extract key scenes for each act (first 3 scenes)
  const summaries = [];
  
  if (act1Scenes.length > 0) {
    summaries.push({
      act: 1,
      pageRange: `1-${act1EndPage}`,
      sceneCount: act1Scenes.length,
      keyScenes: act1Scenes.slice(0, 3).map(s => s.heading)
    });
  }
  
  if (act2Scenes.length > 0) {
    summaries.push({
      act: 2,
      pageRange: `${act1EndPage + 1}-${act2EndPage}`,
      sceneCount: act2Scenes.length,
      keyScenes: act2Scenes.slice(0, 3).map(s => s.heading)
    });
  }
  
  if (act3Scenes.length > 0) {
    summaries.push({
      act: 3,
      pageRange: `${act2EndPage + 1}-${totalPages}`,
      sceneCount: act3Scenes.length,
      keyScenes: act3Scenes.slice(0, 3).map(s => s.heading)
    });
  }
  
  return summaries;
}

/**
 * Retrieves relevant scenes based on query analysis (RAG-style)
 * @param {string} editorContent - Full screenplay content
 * @param {string} query - User's query
 * @param {Object} currentScene - Current scene context
 * @param {number} maxChars - Maximum characters available for relevant scenes
 * @returns {Array<Object>} Array of relevant scene objects
 */
export function retrieveRelevantScenes(editorContent, query, currentScene, maxChars) {
  if (!query || !editorContent) {
    return [];
  }

  // Analyze query for keywords
  const queryLower = query.toLowerCase();
  const lines = editorContent.split('\n');
  const sceneHeadingRegex = /^(INT\.|EXT\.|INT\/EXT\.|I\/E\.)\s+/i;
  
  // Extract character names from query
  const allCharacters = extractAllCharacters(editorContent);
  const mentionedCharacters = allCharacters.filter(char => 
    queryLower.includes(char.toLowerCase())
  );
  
  // Extract act numbers from query
  const actMentions = [];
  if (queryLower.includes('act 1') || queryLower.includes('first act')) actMentions.push(1);
  if (queryLower.includes('act 2') || queryLower.includes('second act') || queryLower.includes('middle')) actMentions.push(2);
  if (queryLower.includes('act 3') || queryLower.includes('third act') || queryLower.includes('final act')) actMentions.push(3);
  
  // Extract location keywords from query
  const locationKeywords = [];
  const commonLocations = ['office', 'house', 'car', 'street', 'room', 'shop', 'restaurant', 'park', 'hospital', 'school'];
  commonLocations.forEach(loc => {
    if (queryLower.includes(loc)) locationKeywords.push(loc);
  });
  
  // Find relevant scenes
  const relevantScenes = [];
  let currentSceneObj = null;
  let sceneStartLine = -1;
  let sceneContent = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (sceneHeadingRegex.test(line.trim())) {
      // Save previous scene if relevant
      if (currentSceneObj && isSceneRelevant(currentSceneObj, mentionedCharacters, actMentions, locationKeywords, queryLower)) {
        relevantScenes.push({
          heading: currentSceneObj.heading,
          content: sceneContent.join('\n'),
          lineNumber: sceneStartLine + 1,
          pageNumber: Math.ceil((sceneStartLine + 1) / 55)
        });
      }
      
      // Start new scene
      currentSceneObj = {
        heading: line.trim(),
        lineNumber: i + 1,
        pageNumber: Math.ceil((i + 1) / 55)
      };
      sceneStartLine = i;
      sceneContent = [line];
    } else if (currentSceneObj) {
      sceneContent.push(line);
    }
  }
  
  // Check last scene
  if (currentSceneObj && isSceneRelevant(currentSceneObj, mentionedCharacters, actMentions, locationKeywords, queryLower)) {
    relevantScenes.push({
      heading: currentSceneObj.heading,
      content: sceneContent.join('\n'),
      lineNumber: sceneStartLine + 1,
      pageNumber: Math.ceil((sceneStartLine + 1) / 55)
    });
  }
  
  // Limit to top 3 most relevant scenes and respect maxChars
  const limitedScenes = relevantScenes.slice(0, 3);
  let totalChars = 0;
  const finalScenes = [];
  
  for (const scene of limitedScenes) {
    if (totalChars + scene.content.length <= maxChars * 0.3) { // Use 30% of available space for relevant scenes
      finalScenes.push(scene);
      totalChars += scene.content.length;
    } else {
      // Truncate scene if needed
      const remaining = Math.max(0, maxChars * 0.3 - totalChars);
      if (remaining > 500) { // Only include if we have at least 500 chars
        finalScenes.push({
          ...scene,
          content: scene.content.substring(0, remaining) + '\n\n[... scene continues ...]'
        });
      }
      break;
    }
  }
  
  return finalScenes;
}

/**
 * Checks if a scene is relevant based on query analysis
 * @param {Object} scene - Scene object
 * @param {Array} mentionedCharacters - Characters mentioned in query
 * @param {Array} actMentions - Act numbers mentioned in query
 * @param {Array} locationKeywords - Location keywords from query
 * @param {string} queryLower - Lowercase query
 * @returns {boolean} True if scene is relevant
 */
function isSceneRelevant(scene, mentionedCharacters, actMentions, locationKeywords, queryLower) {
  const headingLower = scene.heading.toLowerCase();
  
  // Check if scene heading contains mentioned characters
  if (mentionedCharacters.some(char => headingLower.includes(char.toLowerCase()))) {
    return true;
  }
  
  // Check if scene is in mentioned act
  if (actMentions.length > 0) {
    const sceneAct = scene.pageNumber <= 25 ? 1 : (scene.pageNumber <= 75 ? 2 : 3);
    if (actMentions.includes(sceneAct)) {
      return true;
    }
  }
  
  // Check if scene heading contains location keywords
  if (locationKeywords.some(loc => headingLower.includes(loc))) {
    return true;
  }
  
  // Check if query mentions scene-specific terms
  const sceneTerms = ['scene', 'pacing', 'dialogue', 'conflict', 'tension', 'moment'];
  if (sceneTerms.some(term => queryLower.includes(term))) {
    return true;
  }
  
  return false;
}

/**
 * Builds formatted context string for system prompt
 * @param {Object} contextData - Context data from buildStoryAdvisorContext
 * @returns {string} Formatted context string for system prompt
 */
export function buildContextPromptString(contextData) {
  if (!contextData || contextData.type === 'empty') {
    return '';
  }

  let contextString = '';

  if (contextData.type === 'full') {
    // Full screenplay content
    contextString += `\n\nFULL SCREENPLAY CONTENT:\n${contextData.content}\n\n`;
    contextString += `Use this complete screenplay to provide comprehensive analysis, identify plot holes, analyze character arcs, and provide structure feedback.`;
    
    if (contextData.currentScene) {
      contextString += `\n\nYou are currently focused on: ${contextData.currentScene.heading} (Act ${contextData.currentScene.act}, Page ${contextData.currentScene.pageNumber})`;
    }
  } else if (contextData.type === 'structured') {
    // Structured summary
    const structure = contextData.content;
    
    contextString += `\n\nSCREENPLAY STRUCTURE:\n`;
    contextString += `Total Scenes: ${structure.totalScenes}\n`;
    contextString += `Estimated Pages: ${contextData.estimatedPages}\n\n`;
    
    // Scene headings list
    if (structure.sceneHeadings.length > 0) {
      contextString += `SCENE HEADINGS:\n`;
      structure.sceneHeadings.forEach((scene, index) => {
        contextString += `${index + 1}. ${scene.heading} (Page ${scene.pageNumber})\n`;
      });
      contextString += `\n`;
    }
    
    // Character list
    if (structure.characters.length > 0) {
      contextString += `CHARACTERS:\n${structure.characters.join(', ')}\n\n`;
    }
    
    // Act summaries
    if (structure.actSummaries.length > 0) {
      contextString += `ACT SUMMARIES:\n`;
      structure.actSummaries.forEach(act => {
        contextString += `Act ${act.act} (Pages ${act.pageRange}): ${act.sceneCount} scenes. Key scenes: ${act.keyScenes.join(', ')}\n`;
      });
      contextString += `\n`;
    }
    
    // Current scene in full
    if (contextData.currentScene && contextData.currentScene.content) {
      contextString += `CURRENT SCENE (Full Detail):\n${contextData.currentScene.content}\n\n`;
    }
    
    contextString += `Use this structured overview and current scene context to provide specific, relevant advice about the screenplay.`;
  } else if (contextData.type === 'retrieval') {
    // RAG-style retrieval
    const structure = contextData.content;
    
    contextString += `\n\nSCREENPLAY STRUCTURE:\n`;
    contextString += `Total Scenes: ${structure.totalScenes}\n`;
    contextString += `Estimated Pages: ${contextData.estimatedPages}\n\n`;
    
    // Scene headings list (abbreviated for very long screenplays)
    if (structure.sceneHeadings.length > 0) {
      contextString += `SCENE HEADINGS (${structure.sceneHeadings.length} total):\n`;
      // Show first 10 and last 10 for very long screenplays
      if (structure.sceneHeadings.length > 20) {
        structure.sceneHeadings.slice(0, 10).forEach((scene, index) => {
          contextString += `${index + 1}. ${scene.heading} (Page ${scene.pageNumber})\n`;
        });
        contextString += `... (${structure.sceneHeadings.length - 20} scenes) ...\n`;
        structure.sceneHeadings.slice(-10).forEach((scene, index) => {
          contextString += `${structure.sceneHeadings.length - 10 + index + 1}. ${scene.heading} (Page ${scene.pageNumber})\n`;
        });
      } else {
        structure.sceneHeadings.forEach((scene, index) => {
          contextString += `${index + 1}. ${scene.heading} (Page ${scene.pageNumber})\n`;
        });
      }
      contextString += `\n`;
    }
    
    // Character list
    if (structure.characters.length > 0) {
      contextString += `CHARACTERS:\n${structure.characters.join(', ')}\n\n`;
    }
    
    // Act summaries
    if (structure.actSummaries.length > 0) {
      contextString += `ACT SUMMARIES:\n`;
      structure.actSummaries.forEach(act => {
        contextString += `Act ${act.act} (Pages ${act.pageRange}): ${act.sceneCount} scenes. Key scenes: ${act.keyScenes.join(', ')}\n`;
      });
      contextString += `\n`;
    }
    
    // Current scene in full
    if (contextData.currentScene && contextData.currentScene.content) {
      contextString += `CURRENT SCENE (Full Detail):\n${contextData.currentScene.content}\n\n`;
    }
    
    // Relevant scenes
    if (contextData.relevantScenes && contextData.relevantScenes.length > 0) {
      contextString += `RELEVANT SCENES (Based on Your Query):\n`;
      contextData.relevantScenes.forEach((scene, index) => {
        contextString += `\n${index + 1}. ${scene.heading} (Page ${scene.pageNumber}):\n${scene.content}\n`;
      });
      contextString += `\n`;
    }
    
    contextString += `Use this structure overview, current scene, and relevant scenes to provide comprehensive analysis.`;
  }

  return contextString;
}

