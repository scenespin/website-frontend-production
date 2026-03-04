export const ANTHROPIC_MODELS = {
  sonnet: 'claude-sonnet-4-6',
  opus: 'claude-opus-4-6',
  haiku: 'claude-haiku-4-5',
};

const LEGACY_MODEL_REMAP = {
  'claude-sonnet-4-5': ANTHROPIC_MODELS.sonnet,
  'claude-sonnet-4-5-20250929': ANTHROPIC_MODELS.sonnet,
  'claude-opus-4-5': ANTHROPIC_MODELS.opus,
  'claude-opus-4-5-20251101': ANTHROPIC_MODELS.opus,
  'claude-opus-4-5-20251124': ANTHROPIC_MODELS.opus,
  'claude-opus-4-1': ANTHROPIC_MODELS.opus,
  'claude-opus-4-1-20250805': ANTHROPIC_MODELS.opus,
  'claude-3-5-sonnet-20241022': ANTHROPIC_MODELS.sonnet,
  'claude-haiku-4-5-20251001': ANTHROPIC_MODELS.haiku,
};

export function normalizeAnthropicModelId(modelId) {
  if (!modelId) return modelId;
  return LEGACY_MODEL_REMAP[modelId] || modelId;
}
