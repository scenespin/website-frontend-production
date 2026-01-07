/**
 * Token Calculator Utility
 * 
 * Calculates how much content we can safely include in prompts based on:
 * - Model's context window
 * - Current conversation history
 * - System prompt size
 * - Reserved space for responses
 */

// Model context windows (tokens)
// These are conservative estimates - actual windows may be larger
const MODEL_CONTEXT_WINDOWS = {
  // Claude (Anthropic) - typically 200K tokens
  'claude-sonnet-4-5-20250929': 200000,
  'claude-opus-4-5-20251101': 200000,
  'claude-opus-4-1-20250805': 200000,
  'claude-haiku-4-5-20251001': 200000,
  'claude-3-5-sonnet-20241022': 200000,
  'claude-3-7-sonnet-20250219': 200000,
  
  // GPT (OpenAI)
  'gpt-5.1': 128000,  // Latest GPT (Nov 2025)
  'o3': 200000,  // Reasoning model, larger context
  'o1': 200000,  // Reasoning model, larger context
  'gpt-5': 128000,
  'gpt-4.5-turbo': 128000,
  'gpt-4o': 128000,
  'gpt-4-turbo': 128000,
  'gpt-4': 8192,
  'gpt-3.5-turbo': 16385,
  
  // Gemini (Google)
  'gemini-3-pro': 1000000,  // 1M token input context (64K output)
  'gemini-2.5-pro': 2000000,  // 2M tokens!
  'gemini-2.5-flash': 1000000, // 1M tokens
  'gemini-2.0-flash-001': 1000000,
};

// Token estimation: ~4 characters per token (conservative estimate)
const CHARS_PER_TOKEN = 4;

// Reserved space (tokens)
const RESERVED_FOR_SYSTEM_PROMPT = 2000;  // Base system prompt
const RESERVED_FOR_USER_MESSAGE = 1000;   // Current user message
const RESERVED_FOR_RESPONSE = 4096;       // Model response (max_tokens)
const RESERVED_FOR_CONVERSATION_OVERHEAD = 1000; // Message formatting, etc.

/**
 * Estimates token count from text
 * @param {string} text - Text to estimate
 * @returns {number} Estimated token count
 */
export function estimateTokens(text) {
  if (!text) return 0;
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

/**
 * Gets the context window for a model
 * @param {string} modelId - Model identifier
 * @returns {number} Context window in tokens (default: 128000 for safety)
 */
export function getModelContextWindow(modelId) {
  return MODEL_CONTEXT_WINDOWS[modelId] || 128000; // Default to 128K if unknown
}

/**
 * Calculates how much content we can include based on available context
 * @param {string} modelId - Selected model
 * @param {Array} conversationHistory - Previous messages
 * @param {string} systemPromptBase - Base system prompt (without content)
 * @param {string} userMessage - Current user message
 * @returns {number} Maximum characters we can include for screenplay content
 */
export function calculateMaxContentChars(modelId, conversationHistory = [], systemPromptBase = '', userMessage = '') {
  const contextWindow = getModelContextWindow(modelId);
  
  // Calculate used tokens
  const systemPromptTokens = estimateTokens(systemPromptBase);
  const userMessageTokens = estimateTokens(userMessage);
  const conversationTokens = conversationHistory.reduce((total, msg) => {
    return total + estimateTokens(msg.content || '') + estimateTokens(msg.role || '');
  }, 0);
  
  // Calculate reserved tokens
  const reservedTokens = 
    RESERVED_FOR_SYSTEM_PROMPT + 
    RESERVED_FOR_USER_MESSAGE + 
    RESERVED_FOR_RESPONSE + 
    RESERVED_FOR_CONVERSATION_OVERHEAD;
  
  // Calculate available space
  const usedTokens = systemPromptTokens + userMessageTokens + conversationTokens;
  const availableTokens = contextWindow - usedTokens - reservedTokens;
  
  // Convert to characters (with 20% safety margin)
  const maxChars = Math.floor(availableTokens * CHARS_PER_TOKEN * 0.8);
  
  // Ensure minimum of 10K chars (for small models) and maximum of full screenplay
  return Math.max(10000, Math.min(maxChars, 1000000)); // Cap at 1M chars
}

/**
 * Intelligently includes screenplay content up to the calculated limit
 * @param {string} content - Full screenplay/scene content
 * @param {number} maxChars - Maximum characters to include
 * @returns {string} Content preview (truncated if needed)
 */
export function includeContentUpToLimit(content, maxChars) {
  if (!content) return '';
  
  if (content.length <= maxChars) {
    // Full content fits - include it all
    return content;
  }
  
  // Content is too long - include as much as possible
  // Try to truncate at a scene boundary if possible
  const truncated = content.substring(0, maxChars);
  
  // Check if we can find a scene heading near the end to make a clean cut
  const sceneHeadingRegex = /^(INT\.|EXT\.|INT\/EXT\.|I\/E\.)\s+/im;
  const lines = truncated.split('\n');
  
  // Look backwards from the end to find the last complete scene
  for (let i = lines.length - 1; i >= Math.max(0, lines.length - 50); i--) {
    if (sceneHeadingRegex.test(lines[i])) {
      // Found a scene heading - include up to this point
      return lines.slice(0, i + 1).join('\n') + '\n\n[... screenplay continues ...]';
    }
  }
  
  // No clean scene boundary found - just truncate
  return truncated + '\n\n[... screenplay continues ...]';
}

