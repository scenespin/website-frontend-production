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

  // Step 1: Try to extract JSON from markdown code blocks
  // Some models wrap JSON in ```json ... ``` blocks
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
  // Some models add explanations before/after JSON
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
  if (!parsedJson.content) {
    errors.push('Missing required field: "content"');
  } else if (!Array.isArray(parsedJson.content)) {
    errors.push('Field "content" must be an array');
  } else if (parsedJson.content.length < 1) {
    errors.push('Field "content" must have at least 1 item');
  } else if (parsedJson.content.length > 5) {
    errors.push('Field "content" must have at most 5 items');
  } else {
    // Validate each line in content array
    parsedJson.content.forEach((line, index) => {
      if (typeof line !== 'string') {
        errors.push(`Content item ${index} must be a string`);
      } else if (line.trim().length === 0) {
        errors.push(`Content item ${index} is empty`);
      } else {
        // Check for forbidden patterns
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
  if (contextBeforeCursor && parsedJson.content && Array.isArray(parsedJson.content)) {
    const contextLines = contextBeforeCursor.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    parsedJson.content.forEach((line, index) => {
      const normalizedLine = line.trim().toLowerCase().replace(/\s+/g, ' ');
      const isDuplicate = contextLines.some(contextLine => {
        const normalizedContext = contextLine.toLowerCase().replace(/\s+/g, ' ');
        return normalizedContext === normalizedLine || 
               (normalizedContext.includes(normalizedLine) && normalizedLine.length > 10);
      });
      if (isDuplicate) {
        errors.push(`Content item ${index} is a duplicate of content before cursor`);
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

