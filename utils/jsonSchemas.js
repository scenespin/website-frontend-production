/**
 * JSON Schema Definitions for Structured Outputs
 * 
 * These schemas are used with LLM structured outputs (response_format parameter)
 * to ensure 100% valid JSON generation for all writing agents.
 */

/**
 * Get JSON schema for Screenwriter agent
 * @returns {Object} JSON schema for Screenwriter content
 */
export function getScreenwriterSchema() {
  return {
    type: "object",
    properties: {
      content: {
        type: "array",
        items: {
          type: "string"
        },
        minItems: 1,
        maxItems: 3,
        description: "Array of 1-3 screenplay lines (action or dialogue). No scene headings (INT./EXT.)."
      }
      // Note: lineCount removed - OpenAI requires all properties in 'required' array
      // If needed, it can be added back but must be in required array
    },
    required: ["content"],
    additionalProperties: false
  };
}

/**
 * Get JSON schema for Director agent
 * @param {number} sceneCount - Number of scenes to generate (1, 2, or 3)
 * @returns {Object} JSON schema for Director content
 */
export function getDirectorSchema(sceneCount = 3) {
  return {
    type: "object",
    properties: {
      scenes: {
        type: "array",
        items: {
          type: "object",
          properties: {
            heading: {
              type: "string",
              pattern: "^(INT\\.|EXT\\.|I\\/E\\.)",
              description: "Scene heading starting with INT./EXT./I/E."
            },
            content: {
              type: "array",
              items: {
                type: "string"
              },
              minItems: 5,
              maxItems: 50,
              description: "Array of 5-50 screenplay lines (action, dialogue, character names). Each scene's content should end without trailing newlines - spacing between scenes is handled by the formatter."
            }
          },
          required: ["heading", "content"],
          additionalProperties: false
        },
        minItems: sceneCount,
        maxItems: sceneCount,
        description: `Array of exactly ${sceneCount} scene(s)`
      }
      // Note: totalLines removed - OpenAI requires all properties in 'required' array
      // If needed, it can be added back but must be in required array
    },
    required: ["scenes"],
    additionalProperties: false
  };
}

/**
 * Get JSON schema for Dialog agent
 * @returns {Object} JSON schema for Dialog content
 */
export function getDialogSchema() {
  return {
    type: "object",
    properties: {
      dialogue: {
        type: "array",
        items: {
          type: "object",
          properties: {
            character: {
              type: "string",
              description: "Character name in ALL CAPS"
            },
            line: {
              type: "string",
              description: "Dialogue line"
            }
            // Note: subtext removed - OpenAI requires all properties in 'required' array
            // If subtext is needed, it must be added to required array
          },
          required: ["character", "line"],
          additionalProperties: false
        },
        minItems: 1,
        description: "Array of dialogue exchanges"
      }
      // Note: breakdown removed - OpenAI requires all properties in 'required' array
      // If breakdown is needed, it must be added to required array
    },
    required: ["dialogue"],
    additionalProperties: false
  };
}

/**
 * Get JSON schema for Rewrite agent
 * @returns {Object} JSON schema for Rewrite content
 */
export function getRewriteSchema() {
  return {
    type: "object",
    properties: {
      rewrittenText: {
        type: "string",
        description: "Rewritten text in Fountain format, maintaining proper spacing and structure"
      }
    },
    required: ["rewrittenText"],
    additionalProperties: false
  };
}

