/**
 * Canonical UI-exposed model catalog for the public Models page.
 * Only models actually exposed in the Wryda UI.
 *
 * - LLMs: Editor (Story Advisor, Character, Location agents + modals + Model Selector)
 * - Image: 2 models exposed in Scene Builder / reference-shot selectors
 * - Video: All models in the Video Gen dropdown (playground)
 */

export const llmModels = [
  // Anthropic
  { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6', provider: 'Anthropic', surface: 'Editor (Chat + Modals)' },
  { id: 'claude-opus-4-6', name: 'Claude Opus 4.6', provider: 'Anthropic', surface: 'Editor (Chat + Modals)' },
  { id: 'claude-haiku-4-5', name: 'Claude Haiku 4.5', provider: 'Anthropic', surface: 'Editor (Chat + Modals)' },
  // OpenAI
  { id: 'gpt-5.1', name: 'GPT-5.1', provider: 'OpenAI', surface: 'Editor (Chat + Modals)' },
  { id: 'gpt-5', name: 'GPT-5', provider: 'OpenAI', surface: 'Model Selector' },
  { id: 'gpt-4.5-turbo', name: 'GPT-4.5 Turbo', provider: 'OpenAI', surface: 'Model Selector' },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', surface: 'Editor (Chat + Modals + Model Selector)' },
  { id: 'o3', name: 'O3', provider: 'OpenAI', surface: 'Editor (Chat + Modals)' },
  // Google
  { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro', provider: 'Google', surface: 'Editor (Chat + Modals)' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'Google', surface: 'Model Selector' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Google', surface: 'Editor (Chat + Modals + Model Selector)' },
  { id: 'gemini-2.0-flash-001', name: 'Gemini 2.0 Flash', provider: 'Google', surface: 'Model Selector' },
  // xAI
  { id: 'grok-4-0709', name: 'Grok 4', provider: 'xAI', surface: 'Editor (Chat + Modals)' },
  { id: 'grok-4-1-fast-reasoning', name: 'Grok 4.1 Fast', provider: 'xAI', surface: 'Editor (Chat + Modals)' },
  { id: 'grok-4-1-fast-non-reasoning', name: 'Grok 4.1 Fast Lite', provider: 'xAI', surface: 'Editor (Chat + Modals)' },
];

// Image models exposed in Scene Builder / reference-shot selectors
export const imageModels = [
  { id: 'nano-banana-pro', name: 'Nano Banana Pro', provider: 'Google', surface: 'Scene Builder / Reference Shot' },
  { id: 'flux2-max-4k-16:9', name: 'FLUX.2 [max] (4K)', provider: 'Black Forest Labs', surface: 'Scene Builder / Reference Shot' },
  { id: 'flux2-pro-4k', name: 'FLUX.2 [pro] (4K)', provider: 'Black Forest Labs', surface: 'Scene Builder / Reference Shot' },
];

// Video models in the Video Gen dropdown (playground) — launch-ready only
export const videoModels = [
  { id: 'runway-gen4-5', name: 'Runway Gen-4.5', provider: 'Runway', notes: '' },
  { id: 'runway-gen4-turbo', name: 'Runway Gen-4 Turbo', provider: 'Runway', notes: '' },
  { id: 'luma-ray-flash-2', name: 'Luma Ray 2 Flash', provider: 'Luma', notes: '' },
  { id: 'luma-ray-2', name: 'Luma Ray 2', provider: 'Luma', notes: '' },
  { id: 'veo-2', name: 'Google Veo 2.0', provider: 'Google', notes: '' },
  { id: 'veo-3', name: 'Google Veo 3.0', provider: 'Google', notes: '' },
  { id: 'veo-3.1', name: 'Google Veo 3.1', provider: 'Google', notes: 'Audio/dialog capable' },
  { id: 'sora-2', name: 'OpenAI Sora 2', provider: 'OpenAI', notes: '' },
  { id: 'sora-2-pro', name: 'OpenAI Sora 2 Pro', provider: 'OpenAI', notes: '' },
  { id: 'sora-2-pro-hd', name: 'OpenAI Sora 2 Pro HD', provider: 'OpenAI', notes: '' },
  { id: 'grok-imagine-video', name: 'xAI Grok Video', provider: 'xAI', notes: '' },
];
