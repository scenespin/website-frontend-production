/**
 * JSON Validator for Structured Output (Phase 4)
 * 
 * Validates JSON responses from LLMs to ensure they match our screenplay content schema.
 * Handles edge cases like JSON in markdown code blocks, partial JSON, etc.
 */

/**
 * Validates and extracts screenplay content from JSON response
 * @param {string} jsonResponse - Raw response from LLM (may be JSON or markdown-wrapped)
 * @param {string} contextBeforeCursor - Optional context to check for duplicates
 * @returns {{ valid: boolean, content: string, errors: string[], rawJson?: object }}
 */
export function validateScreenplayContent(jsonResponse, contextBeforeCursor = null) {
  if (!jsonResponse || typeof jsonResponse !== 'string') {
    return {
      valid: false,
      content: '',
      errors: ['Response is empty or not a string']
    };
  }

  let parsedJson = null;
  let rawJsonString = jsonResponse.trim();

  // With structured outputs, JSON should always be valid and clean
  // However, we keep extraction logic as fallback for unsupported models
  
  // Step 1: Try direct parse first (structured outputs should work this way)
  try {
    parsedJson = JSON.parse(rawJsonString);
  } catch (directParseError) {
    // Step 2: Fallback - Try to extract JSON from markdown code blocks
    // Some models (without structured outputs) wrap JSON in ```json ... ``` blocks
    const jsonBlockMatch = rawJsonString.match(/```json\s*([\s\S]*?)\s*```/i);
    if (jsonBlockMatch) {
      rawJsonString = jsonBlockMatch[1].trim();
    } else {
      // Also try generic code blocks
      const codeBlockMatch = rawJsonString.match(/```\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch && codeBlockMatch[1].trim().startsWith('{')) {
        rawJsonString = codeBlockMatch[1].trim();
      }
    }

    // Step 3: Try to find JSON object in the response
    // Some models add explanations before/after JSON
    const jsonObjectMatch = rawJsonString.match(/\{[\s\S]*\}/);
    if (jsonObjectMatch) {
      rawJsonString = jsonObjectMatch[0];
    }

    // Step 4: Try parsing again after extraction
    try {
      parsedJson = JSON.parse(rawJsonString);
    } catch (error) {
      return {
        valid: false,
        content: '',
        errors: [`JSON parsing failed: ${error.message}`, `Attempted to parse: ${rawJsonString.substring(0, 200)}...`]
      };
    }
  }

  // Step 4: Validate schema
  const errors = [];

  // Check if it's an object
  if (typeof parsedJson !== 'object' || parsedJson === null || Array.isArray(parsedJson)) {
    errors.push('Response must be a JSON object, not an array or primitive');
    return { valid: false, content: '', errors, rawJson: parsedJson };
  }

  // Check for required fields
  if (!parsedJson.content) {
    errors.push('Missing required field: "content"');
  } else if (!Array.isArray(parsedJson.content)) {
    errors.push('Field "content" must be an array');
  } else if (parsedJson.content.length < 1) {
    errors.push('Field "content" must have at least 1 item');
  } else if (parsedJson.content.length > 10) {
    errors.push('Field "content" must have at most 10 items (allows for proper Fountain spacing with blank lines)');
  } else {
    // Validate each line in content array
    // Note: Empty strings are ALLOWED for screenplay spacing/formatting (blank lines)
    parsedJson.content.forEach((line, index) => {
      if (typeof line !== 'string') {
        errors.push(`Content item ${index} must be a string`);
      } else if (line.trim().length === 0) {
        // Empty strings are allowed - they create spacing in screenplay format
        // Only check for forbidden patterns if line has content
      } else {
        // Check for forbidden patterns (only on non-empty lines)
        if (/^(INT\.|EXT\.|I\/E\.|#\s*INT\.|#\s*EXT\.)/i.test(line.trim())) {
          errors.push(`Content item ${index} contains a scene heading (forbidden)`);
        }
      }
    });
  }

  // Check lineCount if provided (should match content.length)
  if (parsedJson.lineCount !== undefined) {
    if (typeof parsedJson.lineCount !== 'number') {
      errors.push('Field "lineCount" must be a number');
    } else if (parsedJson.lineCount !== parsedJson.content?.length) {
      errors.push(`Field "lineCount" (${parsedJson.lineCount}) does not match content.length (${parsedJson.content?.length})`);
    }
  }

  // Step 5: Check for duplicate content (if context provided)
  // Simple: Only flag exact matches of substantial content (20+ chars) to avoid false positives
  if (contextBeforeCursor && parsedJson.content && Array.isArray(parsedJson.content)) {
    const contextLines = contextBeforeCursor.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    parsedJson.content.forEach((line, index) => {
      const normalizedLine = line.trim().toLowerCase().replace(/\s+/g, ' ');
      
      // Only check substantial lines (20+ chars) for exact matches
      // This prevents false positives from common words/phrases
      if (normalizedLine.length >= 20) {
        const exactMatch = contextLines.some(contextLine => {
          const normalizedContext = contextLine.toLowerCase().replace(/\s+/g, ' ');
          // Only flag if it's an exact match (not substring) to avoid over-engineering
          return normalizedContext === normalizedLine;
        });
        
        if (exactMatch) {
          errors.push(`Content item ${index} is a duplicate of content before cursor`);
        }
      }
    });
  }

  // Step 6: Extract content if valid
  if (errors.length > 0) {
    return {
      valid: false,
      content: '',
      errors,
      rawJson: parsedJson
    };
  }

  // Join content array into screenplay format
  // Preserve empty strings for spacing (they create blank lines in screenplay format)
  // Only trim leading/trailing whitespace, not internal spacing
  const content = parsedJson.content.join('\n');
  // Trim only leading/trailing whitespace, preserve internal structure
  const trimmedContent = content.replace(/^\s+|\s+$/g, '');

  return {
    valid: true,
    content: trimmedContent,
    errors: [],
    rawJson: parsedJson
  };
}

/**
 * Validates screenwriter content (wrapper for validateScreenplayContent)
 * Screenwriter generates 1-3 lines, so uses the same validator
 * @param {string} jsonResponse - Raw response from LLM
 * @param {string} contextBeforeCursor - Optional context to check for duplicates
 * @returns {{ valid: boolean, content: string, errors: string[], rawJson?: object }}
 */
export function validateScreenwriterContent(jsonResponse, contextBeforeCursor = null) {
  // Screenwriter uses the same structure as validateScreenplayContent
  // (content array with 1-3 items, no scene headings)
  return validateScreenplayContent(jsonResponse, contextBeforeCursor);
}

/**
 * Checks if a model supports native JSON output format
 * @param {string} modelId - Model identifier
 * @returns {boolean}
 */
export function supportsNativeJSON(modelId) {
  if (!modelId) return false;
  
  // OpenAI models with native JSON support
  const openAIModels = ['gpt-4', 'gpt-4-turbo', 'gpt-4-turbo-preview', 'gpt-4o', 'gpt-4o-mini'];
  
  // Anthropic models (Claude) - check if they support response_format parameter
  // Note: Anthropic doesn't have native JSON mode yet, but they follow JSON instructions well
  const anthropicModels = ['claude-3-5-sonnet', 'claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'];
  
  const modelLower = modelId.toLowerCase();
  
  // Check OpenAI models
  if (openAIModels.some(m => modelLower.includes(m))) {
    return true;
  }
  
  // Anthropic models don't have native JSON mode, but we can still use structured prompts
  // Return false so we use prompt engineering instead
  return false;
}

/**
 * Checks if a model supports structured outputs (JSON Schema with strict mode)
 * This is the modern approach used by Cursor/Windsurf for reliable JSON generation
 * @param {string} modelId - Model identifier
 * @returns {boolean} True if model supports structured outputs via response_format parameter
 */
export function supportsStructuredOutputs(modelId) {
  if (!modelId) return false;
  
  const modelLower = modelId.toLowerCase();
  
  // Claude 3.5+ (Sonnet and Opus support structured outputs)
  // NOTE: Haiku 4.5 does NOT support structured outputs - it works without response_format
  if (modelLower.includes('claude-3-5') || 
      modelLower.includes('claude-sonnet-4') || 
      modelLower.includes('claude-opus-4') ||
      modelLower.includes('claude-3-opus') ||
      modelLower.includes('claude-3-sonnet')) {
    return true;
  }
  
  // Explicitly exclude Haiku - it doesn't support structured outputs
  // Haiku works fine without response_format (falls back to prompt-based JSON)
  if (modelLower.includes('claude-haiku-4') || modelLower.includes('claude-3-haiku')) {
    return false;
  }
  
  // GPT-4o-2024-08-06+ and GPT-5.x (OpenAI structured outputs)
  if (modelLower.includes('gpt-4o') || 
      modelLower.includes('gpt-5') ||
      modelLower.startsWith('o1') ||
      modelLower.startsWith('o3') ||
      modelLower.includes('gpt-4-turbo')) {
    return true;
  }
  
  // Gemini 2.5+ (Google structured outputs)
  if (modelLower.includes('gemini-2.5') || 
      modelLower.includes('gemini-3') ||
      modelLower.includes('gemini-2.0')) {
    return true;
  }
  
  return false;
}

/**
 * Validates and extracts director content from JSON response (supports longer content)
 * Director agent generates 5-50+ lines, so this validator is more permissive
 * @param {string} jsonResponse - Raw response from LLM (may be JSON or markdown-wrapped)
 * @param {string} contextBeforeCursor - Optional context to check for duplicates
 * @param {string} generationLength - 'short' (5-10), 'full' (15-30), 'multiple' (50+)
 * @returns {{ valid: boolean, content: string, errors: string[], rawJson?: object }}
 */
export function validateDirectorContent(jsonResponse, contextBeforeCursor = null, generationLength = 'full', sceneCount = 3) {
  if (!jsonResponse || typeof jsonResponse !== 'string') {
    return {
      valid: false,
      content: '',
      errors: ['Response is empty or not a string']
    };
  }

  let parsedJson = null;
  let rawJsonString = jsonResponse.trim();

  // Step 1: Try to extract JSON from markdown code blocks
  const jsonBlockMatch = rawJsonString.match(/```json\s*([\s\S]*?)\s*```/i);
  if (jsonBlockMatch) {
    rawJsonString = jsonBlockMatch[1].trim();
  }

  // Also try generic code blocks
  const codeBlockMatch = rawJsonString.match(/```\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch && codeBlockMatch[1].trim().startsWith('{')) {
    rawJsonString = codeBlockMatch[1].trim();
  }

  // Step 2: Try to find JSON object in the response
  const jsonObjectMatch = rawJsonString.match(/\{[\s\S]*\}/);
  if (jsonObjectMatch) {
    rawJsonString = jsonObjectMatch[0];
  }

  // Step 3: Parse JSON
  try {
    parsedJson = JSON.parse(rawJsonString);
  } catch (error) {
    return {
      valid: false,
      content: '',
      errors: [`JSON parsing failed: ${error.message}`, `Attempted to parse: ${rawJsonString.substring(0, 200)}...`]
    };
  }

  // Step 4: Validate schema
  const errors = [];

  // Check if it's an object
  if (typeof parsedJson !== 'object' || parsedJson === null || Array.isArray(parsedJson)) {
    errors.push('Response must be a JSON object, not an array or primitive');
    return { valid: false, content: '', errors, rawJson: parsedJson };
  }

  // Define max lines based on generation length
  // For multiple scenes, allow up to 50 lines per scene
  const maxLines = generationLength === 'short' 
    ? 15 
    : generationLength === 'multiple' 
    ? sceneCount * 50  // 50 lines per scene
    : 50;

  // Check for required fields
  if (!parsedJson.content) {
    errors.push('Missing required field: "content"');
  } else if (!Array.isArray(parsedJson.content)) {
    errors.push('Field "content" must be an array');
  } else if (parsedJson.content.length < 1) {
    errors.push('Field "content" must have at least 1 item');
  } else if (parsedJson.content.length > maxLines) {
    errors.push(`Field "content" must have at most ${maxLines} items (got ${parsedJson.content.length})`);
  } else {
    // Validate each line in content array
    // Note: Empty strings are ALLOWED for screenplay spacing/formatting
    parsedJson.content.forEach((line, index) => {
      if (typeof line !== 'string') {
        errors.push(`Content item ${index} must be a string`);
      }
      // Empty strings are allowed - they create spacing in screenplay format
      // Note: Director agent CAN include scene headings for multiple scenes mode
      // So we don't check for scene headings here
    });
  }

  // Check lineCount if provided (should match content.length)
  if (parsedJson.lineCount !== undefined) {
    if (typeof parsedJson.lineCount !== 'number') {
      errors.push('Field "lineCount" must be a number');
    } else if (parsedJson.lineCount !== parsedJson.content?.length) {
      errors.push(`Field "lineCount" (${parsedJson.lineCount}) does not match content.length (${parsedJson.content?.length})`);
    }
  }

  // Step 5: Check for duplicate content (if context provided)
  // For director agent, we're more lenient - only check for exact duplicates of substantial content
  // BUT: For multiple scenes mode, we're more strict - don't allow repeating scene headings
  if (contextBeforeCursor && parsedJson.content && Array.isArray(parsedJson.content)) {
    const contextLines = contextBeforeCursor.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    parsedJson.content.forEach((line, index) => {
      const normalizedLine = line.trim().toLowerCase().replace(/\s+/g, ' ');
      
      // Check for scene heading duplicates (always flag these)
      if (/^(int\.|ext\.|i\/e\.)/i.test(normalizedLine)) {
        const isDuplicateHeading = contextLines.some(contextLine => {
          const normalizedContext = contextLine.toLowerCase().replace(/\s+/g, ' ');
          // Check if this scene heading matches any scene heading in context
          if (/^(int\.|ext\.|i\/e\.)/i.test(normalizedContext)) {
            // Compare location and time parts (ignore exact formatting)
            const lineParts = normalizedLine.split(/\s+-\s+/);
            const contextParts = normalizedContext.split(/\s+-\s+/);
            if (lineParts.length >= 2 && contextParts.length >= 2) {
              // If location matches, it's likely a duplicate
              return lineParts[0] === contextParts[0];
            }
          }
          return normalizedContext === normalizedLine;
        });
        if (isDuplicateHeading) {
          errors.push(`Content item ${index} is a duplicate scene heading from content before cursor`);
        }
      }
      
      // For other content, only flag as duplicate if it's substantial (more than 20 chars) and exact match
      if (normalizedLine.length > 20 && !/^(int\.|ext\.|i\/e\.)/i.test(normalizedLine)) {
        const isDuplicate = contextLines.some(contextLine => {
          const normalizedContext = contextLine.toLowerCase().replace(/\s+/g, ' ');
          return normalizedContext === normalizedLine;
        });
        if (isDuplicate) {
          errors.push(`Content item ${index} is a duplicate of content before cursor`);
        }
      }
    });
  }

  // Step 6: Extract content if valid
  if (errors.length > 0) {
    return {
      valid: false,
      content: '',
      errors,
      rawJson: parsedJson
    };
  }

  // Join content array into screenplay format
  const content = parsedJson.content.join('\n').trim();

  return {
    valid: true,
    content,
    errors: [],
    rawJson: parsedJson
  };
}

/**
 * Validates and extracts rewrite content from JSON response
 * @param {string} jsonResponse - Raw response from LLM (may be JSON or markdown-wrapped)
 * @returns {{ valid: boolean, rewrittenText: string, errors: string[], rawJson?: object }}
 */
export function validateRewriteContent(jsonResponse) {
  if (!jsonResponse || typeof jsonResponse !== 'string') {
    return {
      valid: false,
      rewrittenText: '',
      errors: ['Response is empty or not a string']
    };
  }

  let parsedJson = null;
  let rawJsonString = jsonResponse.trim();

  // Step 1: Try to extract JSON from markdown code blocks
  const jsonBlockMatch = rawJsonString.match(/```json\s*([\s\S]*?)\s*```/i);
  if (jsonBlockMatch) {
    rawJsonString = jsonBlockMatch[1].trim();
  }

  // Also try generic code blocks
  const codeBlockMatch = rawJsonString.match(/```\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch && codeBlockMatch[1].trim().startsWith('{')) {
    rawJsonString = codeBlockMatch[1].trim();
  }

  // Step 2: Try to find JSON object in the response
  const jsonObjectMatch = rawJsonString.match(/\{[\s\S]*\}/);
  if (jsonObjectMatch) {
    rawJsonString = jsonObjectMatch[0];
  }

  // Step 3: Parse JSON
  try {
    parsedJson = JSON.parse(rawJsonString);
  } catch (error) {
    return {
      valid: false,
      rewrittenText: '',
      errors: [`JSON parsing failed: ${error.message}`, `Attempted to parse: ${rawJsonString.substring(0, 200)}...`]
    };
  }

  // Step 4: Validate schema
  const errors = [];

  // Check if it's an object
  if (typeof parsedJson !== 'object' || parsedJson === null || Array.isArray(parsedJson)) {
    errors.push('Response must be a JSON object, not an array or primitive');
    return { valid: false, rewrittenText: '', errors, rawJson: parsedJson };
  }

  // Check for required field
  if (!parsedJson.rewrittenText) {
    errors.push('Missing required field: "rewrittenText"');
  } else if (typeof parsedJson.rewrittenText !== 'string') {
    errors.push('Field "rewrittenText" must be a string');
  } else if (parsedJson.rewrittenText.trim().length === 0) {
    errors.push('Field "rewrittenText" cannot be empty');
  }

  // Step 5: Extract content if valid
  if (errors.length > 0) {
    return {
      valid: false,
      rewrittenText: '',
      errors,
      rawJson: parsedJson
    };
  }

  // Trim only leading/trailing whitespace, preserve internal structure
  // 🔥 FIX: Don't trim - preserve trailing newlines for proper spacing
  // Only trim leading whitespace to clean up formatting
  const rewrittenText = parsedJson.rewrittenText.trimStart();

  return {
    valid: true,
    rewrittenText,
    errors: [],
    rawJson: parsedJson
  };
}

/**
 * Validates and extracts director modal content from JSON response (scenes format)
 * @param {string} jsonResponse - Raw response from LLM (may be JSON or markdown-wrapped)
 * @param {string} contextBeforeCursor - Optional context to check for duplicates
 * @param {number} expectedSceneCount - Expected number of scenes (1, 2, or 3)
 * @returns {{ valid: boolean, content: string, errors: string[], rawJson?: object }}
 */
export function validateDirectorModalContent(jsonResponse, contextBeforeCursor = null, expectedSceneCount = 1) {
  if (!jsonResponse || typeof jsonResponse !== 'string') {
    return {
      valid: false,
      content: '',
      errors: ['Response is empty or not a string']
    };
  }

  let parsedJson = null;
  let rawJsonString = jsonResponse.trim();

  // Step 1: Try to extract JSON from markdown code blocks
  const jsonBlockMatch = rawJsonString.match(/```json\s*([\s\S]*?)\s*```/i);
  if (jsonBlockMatch) {
    rawJsonString = jsonBlockMatch[1].trim();
  }

  // Also try generic code blocks
  const codeBlockMatch = rawJsonString.match(/```\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch && codeBlockMatch[1].trim().startsWith('{')) {
    rawJsonString = codeBlockMatch[1].trim();
  }

  // Step 2: Try to find JSON object in the response
  const jsonObjectMatch = rawJsonString.match(/\{[\s\S]*\}/);
  if (jsonObjectMatch) {
    rawJsonString = jsonObjectMatch[0];
  }

  // Step 3: Parse JSON
  try {
    parsedJson = JSON.parse(rawJsonString);
  } catch (error) {
    return {
      valid: false,
      content: '',
      errors: [`JSON parsing failed: ${error.message}`, `Attempted to parse: ${rawJsonString.substring(0, 200)}...`]
    };
  }

  // Step 4: Validate schema
  const errors = [];

  // Check if it's an object
  if (typeof parsedJson !== 'object' || parsedJson === null || Array.isArray(parsedJson)) {
    errors.push('Response must be a JSON object, not an array or primitive');
    return { valid: false, content: '', errors, rawJson: parsedJson };
  }

  // Check for required fields
  if (!parsedJson.scenes) {
    errors.push('Missing required field: "scenes"');
  } else if (!Array.isArray(parsedJson.scenes)) {
    errors.push('Field "scenes" must be an array');
  } else if (parsedJson.scenes.length < 1) {
    errors.push('Field "scenes" must have at least 1 scene');
  } else if (parsedJson.scenes.length > 3) {
    errors.push('Field "scenes" must have at most 3 scenes');
  } else if (parsedJson.scenes.length !== expectedSceneCount) {
    errors.push(`Expected ${expectedSceneCount} scene(s), got ${parsedJson.scenes.length}`);
  } else {
    // Validate each scene
    parsedJson.scenes.forEach((scene, sceneIndex) => {
      if (typeof scene !== 'object' || scene === null || Array.isArray(scene)) {
        errors.push(`Scene ${sceneIndex + 1} must be an object`);
        return;
      }

      if (!scene.heading) {
        errors.push(`Scene ${sceneIndex + 1}: Missing required field "heading"`);
      } else if (typeof scene.heading !== 'string') {
        errors.push(`Scene ${sceneIndex + 1}: Field "heading" must be a string`);
      } else if (!/^(INT\.|EXT\.|I\/E\.)/i.test(scene.heading.trim())) {
        errors.push(`Scene ${sceneIndex + 1}: Heading must start with INT./EXT./I\/E.`);
      }

      if (!scene.content) {
        errors.push(`Scene ${sceneIndex + 1}: Missing required field "content"`);
      } else if (!Array.isArray(scene.content)) {
        errors.push(`Scene ${sceneIndex + 1}: Field "content" must be an array`);
      } else if (scene.content.length < 5) {
        errors.push(`Scene ${sceneIndex + 1}: Content must have at least 5 lines`);
      } else if (scene.content.length > 50) {
        errors.push(`Scene ${sceneIndex + 1}: Content must have at most 50 lines`);
      } else {
        // Validate each line in content
        scene.content.forEach((line, lineIndex) => {
          if (typeof line !== 'string') {
            errors.push(`Scene ${sceneIndex + 1}, line ${lineIndex + 1}: Must be a string`);
          } else {
            // Check for forbidden organizational elements (should not be in scene content)
            const trimmed = line.trim();
            if (trimmed.startsWith('=')) {
              errors.push(`Scene ${sceneIndex + 1}, line ${lineIndex + 1}: Synopses (lines starting with =) are not allowed in scene content. Synopses are organizational tools added by writers, not generated by the Director agent.`);
            }
            if (trimmed.startsWith('#')) {
              errors.push(`Scene ${sceneIndex + 1}, line ${lineIndex + 1}: Act breaks (lines starting with #) are not allowed in scene content. Act breaks are organizational tools added by writers, not generated by the Director agent.`);
            }
          }
        });
      }
    });
  }

  // Check totalLines if provided (non-blocking - just warn, don't fail)
  if (parsedJson.totalLines !== undefined) {
    if (typeof parsedJson.totalLines !== 'number') {
      // Warn but don't block - totalLines is optional metadata
      console.warn('[validateDirectorModalContent] totalLines is not a number, ignoring');
    } else {
      const actualTotal = parsedJson.scenes?.reduce((sum, scene) => sum + (scene.content?.length || 0), 0) || 0;
      if (parsedJson.totalLines !== actualTotal) {
        // Warn but don't block - totalLines is just metadata, content is what matters
        console.warn(`[validateDirectorModalContent] totalLines (${parsedJson.totalLines}) doesn't match actual content length (${actualTotal}), but continuing anyway`);
      }
    }
  }

  // Step 5: Check for duplicate content (if context provided)
  if (contextBeforeCursor && parsedJson.scenes && Array.isArray(parsedJson.scenes)) {
    const contextLines = contextBeforeCursor.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    parsedJson.scenes.forEach((scene, sceneIndex) => {
      // Check for duplicate scene headings
      if (scene.heading) {
        const normalizedHeading = scene.heading.trim().toLowerCase().replace(/\s+/g, ' ');
        const isDuplicateHeading = contextLines.some(contextLine => {
          const normalizedContext = contextLine.toLowerCase().replace(/\s+/g, ' ');
          if (/^(int\.|ext\.|i\/e\.)/i.test(normalizedContext)) {
            const headingParts = normalizedHeading.split(/\s+-\s+/);
            const contextParts = normalizedContext.split(/\s+-\s+/);
            if (headingParts.length >= 2 && contextParts.length >= 2) {
              return headingParts[0] === contextParts[0];
            }
          }
          return normalizedContext === normalizedHeading;
        });
        if (isDuplicateHeading) {
          errors.push(`Scene ${sceneIndex + 1}: Scene heading is a duplicate of content before cursor`);
        }
      }
    });
  }

  // Step 6: Extract content if valid
  if (errors.length > 0) {
    return {
      valid: false,
      content: '',
      errors,
      rawJson: parsedJson
    };
  }

  // Format scenes into screenplay format
  const formattedScenes = parsedJson.scenes.map(scene => {
    const heading = scene.heading.trim();
    const content = scene.content.join('\n').trim();
    return `${heading}\n\n${content}`;
  });

  const content = formattedScenes.join('\n\n');

  return {
    valid: true,
    content,
    errors: [],
    rawJson: parsedJson
  };
}

/**
 * Validates and extracts dialogue content from JSON response
 * @param {string} jsonResponse - Raw response from LLM (may be JSON or markdown-wrapped)
 * @param {string} contextBeforeCursor - Optional context to check for duplicates
 * @returns {{ valid: boolean, content: string, errors: string[], rawJson?: object }}
 */
export function validateDialogueContent(jsonResponse, contextBeforeCursor = null) {
  if (!jsonResponse || typeof jsonResponse !== 'string') {
    return {
      valid: false,
      content: '',
      errors: ['Response is empty or not a string']
    };
  }

  let parsedJson = null;
  let rawJsonString = jsonResponse.trim();

  // Step 1: Try to extract JSON from markdown code blocks
  const jsonBlockMatch = rawJsonString.match(/```json\s*([\s\S]*?)\s*```/i);
  if (jsonBlockMatch) {
    rawJsonString = jsonBlockMatch[1].trim();
  }

  // Also try generic code blocks
  const codeBlockMatch = rawJsonString.match(/```\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch && codeBlockMatch[1].trim().startsWith('{')) {
    rawJsonString = codeBlockMatch[1].trim();
  }

  // Step 2: Try to find JSON object in the response
  const jsonObjectMatch = rawJsonString.match(/\{[\s\S]*\}/);
  if (jsonObjectMatch) {
    rawJsonString = jsonObjectMatch[0];
  }

  // Step 3: Parse JSON
  try {
    parsedJson = JSON.parse(rawJsonString);
  } catch (error) {
    return {
      valid: false,
      content: '',
      errors: [`JSON parsing failed: ${error.message}`, `Attempted to parse: ${rawJsonString.substring(0, 200)}...`]
    };
  }

  // Step 4: Validate schema
  const errors = [];

  // Check if it's an object
  if (typeof parsedJson !== 'object' || parsedJson === null || Array.isArray(parsedJson)) {
    errors.push('Response must be a JSON object, not an array or primitive');
    return { valid: false, content: '', errors, rawJson: parsedJson };
  }

  // Check for required fields
  if (!parsedJson.dialogue) {
    errors.push('Missing required field: "dialogue"');
  } else if (!Array.isArray(parsedJson.dialogue)) {
    errors.push('Field "dialogue" must be an array');
  } else if (parsedJson.dialogue.length < 1) {
    errors.push('Field "dialogue" must have at least 1 exchange');
  } else {
    // Validate each dialogue exchange
    parsedJson.dialogue.forEach((exchange, index) => {
      if (typeof exchange !== 'object' || exchange === null || Array.isArray(exchange)) {
        errors.push(`Dialogue exchange ${index + 1} must be an object`);
        return;
      }

      if (!exchange.character) {
        errors.push(`Dialogue exchange ${index + 1}: Missing required field "character"`);
      } else if (typeof exchange.character !== 'string') {
        errors.push(`Dialogue exchange ${index + 1}: Field "character" must be a string`);
      } else if (exchange.character !== exchange.character.toUpperCase()) {
        errors.push(`Dialogue exchange ${index + 1}: Character name must be in ALL CAPS`);
      }

      if (!exchange.line) {
        errors.push(`Dialogue exchange ${index + 1}: Missing required field "line"`);
      } else if (typeof exchange.line !== 'string') {
        errors.push(`Dialogue exchange ${index + 1}: Field "line" must be a string`);
      } else if (exchange.line.trim().length === 0) {
        errors.push(`Dialogue exchange ${index + 1}: Field "line" cannot be empty`);
      }

      if (exchange.subtext !== undefined && typeof exchange.subtext !== 'string') {
        errors.push(`Dialogue exchange ${index + 1}: Field "subtext" must be a string`);
      }
    });
  }

  // Breakdown is optional
  if (parsedJson.breakdown !== undefined && typeof parsedJson.breakdown !== 'string') {
    errors.push('Field "breakdown" must be a string');
  }

  // Step 5: Extract content if valid
  if (errors.length > 0) {
    return {
      valid: false,
      content: '',
      errors,
      rawJson: parsedJson
    };
  }

  // Format dialogue into screenplay format
  const formattedExchanges = parsedJson.dialogue.map(exchange => {
    const characterName = exchange.character.toUpperCase();
    let formatted = `${characterName}\n`;
    
    if (exchange.subtext && exchange.subtext.trim()) {
      formatted += `(${exchange.subtext.trim()})\n`;
    }
    
    formatted += exchange.line;
    return formatted;
  });

  const content = formattedExchanges.join('\n\n');

  return {
    valid: true,
    content,
    errors: [],
    rawJson: parsedJson
  };
}

/**
 * Builds a retry prompt with more explicit JSON instructions
 * @param {string} originalPrompt - Original user prompt
 * @param {string[]} errors - Validation errors from first attempt
 * @returns {string}
 */
export function buildRetryPrompt(originalPrompt, errors) {
  return `${originalPrompt}

⚠️ PREVIOUS ATTEMPT FAILED VALIDATION:
${errors.map(e => `- ${e}`).join('\n')}

Please respond with ONLY valid JSON. No explanations, no markdown formatting, just the raw JSON object.`;
}

