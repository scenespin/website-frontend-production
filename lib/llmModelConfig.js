export const DEFAULT_CHAT_MODEL_ID = 'gpt-4o';

export const LLM_MODEL_TIER_ORDER = ['Fast', 'Balanced', 'Reasoning'];

export const LLM_MODELS = [
  // Fast (budget + speed)
  { id: 'grok-4-1-fast-non-reasoning', name: 'Grok 4.1 Fast Lite', shortName: 'Grok 4.1 Lite', tier: 'Fast', badges: '⚡' },
  { id: 'grok-4-1-fast-reasoning', name: 'Grok 4.1 Fast', shortName: 'Grok 4.1', tier: 'Fast', badges: '⚡ 🧠' },
  { id: 'claude-haiku-4-5', name: 'Claude Haiku 4.5', shortName: 'Haiku 4.5', tier: 'Fast', badges: '⚡ ✍️' },
  // Balanced
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', shortName: 'Gemini 2.5', tier: 'Balanced', badges: '⚡ 🧠' },
  { id: 'gpt-4o', name: 'GPT-4o', shortName: 'GPT-4o', tier: 'Balanced', badges: '⚡' },
  // Reasoning (quality / hard prompts)
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', shortName: 'Gemini 2.5 Pro', tier: 'Reasoning', badges: '🧠' },
  { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro', shortName: 'Gemini 3 Pro', tier: 'Reasoning', badges: '🧠' },
  { id: 'gpt-5.1', name: 'GPT-5.1', shortName: 'GPT-5.1', tier: 'Reasoning', badges: '🧠 ✍️' },
  { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6', shortName: 'Sonnet 4.6', tier: 'Reasoning', badges: '🧠 ✍️' },
  { id: 'grok-4.20-0309-reasoning', name: 'Grok 4.20 Reasoning', shortName: 'Grok 4.20 R', tier: 'Reasoning', badges: '🧠' },
  { id: 'o3', name: 'O3', shortName: 'O3', tier: 'Reasoning', badges: '🧠' },
  { id: 'claude-opus-4-6', name: 'Claude Opus 4.6', shortName: 'Opus 4.6', tier: 'Reasoning', badges: '🧠 ✍️' },
];

export function getLlmModelGroupsByTier() {
  const grouped = LLM_MODELS.reduce((acc, model) => {
    if (!acc[model.tier]) acc[model.tier] = [];
    acc[model.tier].push(model);
    return acc;
  }, {});

  return LLM_MODEL_TIER_ORDER
    .map((tier) => ({ tier, models: grouped[tier] || [] }))
    .filter((group) => group.models.length > 0);
}
