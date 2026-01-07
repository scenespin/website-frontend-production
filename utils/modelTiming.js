/**
 * Model-specific timing expectations and metadata
 * Used to set user expectations and show appropriate loading states
 */

export const MODEL_TIMING = {
  // Anthropic (Claude)
  'claude-sonnet-4-5-20250929': {
    name: 'Claude Sonnet 4.5',
    provider: 'Anthropic',
    typicalTime: '8-12s',
    typicalTimeSeconds: 10,
    description: 'High quality, balanced speed'
  },
  'claude-opus-4-5-20251101': {
    name: 'Claude Opus 4.5',
    provider: 'Anthropic',
    typicalTime: '10-15s',
    typicalTimeSeconds: 12,
    description: 'Most powerful, improved efficiency (3x cheaper!)'
  },
  'claude-opus-4-1-20250805': {
    name: 'Claude Opus 4.1',
    provider: 'Anthropic',
    typicalTime: '12-18s',
    typicalTimeSeconds: 15,
    description: 'Legacy model - use Opus 4.5 instead'
  },
  'claude-haiku-4-5-20251001': {
    name: 'Claude Haiku 4.5',
    provider: 'Anthropic',
    typicalTime: '5-10s',
    typicalTimeSeconds: 7,
    description: 'Fast & economical'
  },
  
  // OpenAI (GPT)
  'gpt-5.1': {
    name: 'GPT-5.1',
    provider: 'OpenAI',
    typicalTime: '15-20s',
    typicalTimeSeconds: 17,
    description: 'Latest model, highest quality'
  },
  'gpt-5': {
    name: 'GPT-5',
    provider: 'OpenAI',
    typicalTime: '15-20s',
    typicalTimeSeconds: 17,
    description: 'Advanced, slower response'
  },
  'gpt-4o': {
    name: 'GPT-4o',
    provider: 'OpenAI',
    typicalTime: '8-12s',
    typicalTimeSeconds: 10,
    description: 'Balanced speed & quality'
  },
  'gpt-4.5-turbo': {
    name: 'GPT-4.5 Turbo',
    provider: 'OpenAI',
    typicalTime: '6-10s',
    typicalTimeSeconds: 8,
    description: 'Fast and capable'
  },
  'o3': {
    name: 'O3',
    provider: 'OpenAI',
    typicalTime: '20-30s',
    typicalTimeSeconds: 25,
    description: 'Reasoning model, takes longer'
  },
  'o1': {
    name: 'O1',
    provider: 'OpenAI',
    typicalTime: '20-30s',
    typicalTimeSeconds: 25,
    description: 'Reasoning model, takes longer'
  },
  
  // Google (Gemini)
  'gemini-3-pro-preview': {
    name: 'Gemini 3 Pro',
    provider: 'Google',
    typicalTime: '10-15s',
    typicalTimeSeconds: 12,
    description: 'Most intelligent, advanced reasoning'
  },
  'gemini-2.5-pro': {
    name: 'Gemini 2.5 Pro',
    provider: 'Google',
    typicalTime: '8-12s',
    typicalTimeSeconds: 10,
    description: 'Advanced reasoning'
  },
  'gemini-2.5-flash': {
    name: 'Gemini 2.5 Flash',
    provider: 'Google',
    typicalTime: '5-8s',
    typicalTimeSeconds: 6,
    description: 'Fast & efficient'
  },
  'gemini-2.0-flash-001': {
    name: 'Gemini 2.0 Flash',
    provider: 'Google',
    typicalTime: '4-7s',
    typicalTimeSeconds: 5,
    description: 'Fastest & most economical'
  }
};

/**
 * Get timing info for a model
 * @param {string} modelId - Model identifier
 * @returns {Object|null} Timing info or null if not found
 */
export function getModelTiming(modelId) {
  return MODEL_TIMING[modelId] || {
    name: 'Unknown Model',
    provider: 'Unknown',
    typicalTime: '8-15s',
    typicalTimeSeconds: 10,
    description: 'Processing...'
  };
}

/**
 * Get a user-friendly timing message
 * @param {string} modelId - Model identifier
 * @returns {string} Timing message
 */
export function getTimingMessage(modelId) {
  const timing = getModelTiming(modelId);
  return `Typically takes ${timing.typicalTime} with enhanced context`;
}

