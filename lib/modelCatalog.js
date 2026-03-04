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
  { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6', provider: 'Anthropic', description: 'Best for creative writing and screenplays. Strong at dialogue, structure, and narrative flow.' },
  { id: 'claude-opus-4-6', name: 'Claude Opus 4.6', provider: 'Anthropic', description: 'Most powerful Claude model. Deep reasoning and analysis for complex story development.' },
  { id: 'claude-haiku-4-5', name: 'Claude Haiku 4.5', provider: 'Anthropic', description: 'Fast and economical. Good for quick rewrites and lighter editing passes.' },
  // OpenAI
  { id: 'gpt-5.1', name: 'GPT-5.1', provider: 'OpenAI', description: 'Latest GPT. Excellent for creative writing and versatile scene generation.' },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', description: 'Balanced speed and quality. Strong for dialogue and scene polish.' },
  { id: 'o3', name: 'O3', provider: 'OpenAI', description: 'Reasoning-focused model. Best for story analysis and structural feedback.' },
  // Google
  { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro', provider: 'Google', description: 'Most advanced Gemini. Strong at complex narratives and multi-thread stories.' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'Google', description: 'Advanced reasoning. Good for character arcs and plot development.' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Google', description: 'Fast and efficient. Solid for quick iterations and dialogue polish.' },
  // xAI
  { id: 'grok-4-0709', name: 'Grok 4', provider: 'xAI', description: 'Flagship Grok. Deep reasoning and creative analysis.' },
  { id: 'grok-4-1-fast-reasoning', name: 'Grok 4.1 Fast', provider: 'xAI', description: 'Fast with reasoning. Good balance of speed and depth.' },
  { id: 'grok-4-1-fast-non-reasoning', name: 'Grok 4.1 Fast Lite', provider: 'xAI', description: 'Ultra-fast and economical. Best for quick edits and light passes.' },
];

// Image models exposed in Scene Builder / reference-shot selectors
export const imageModels = [
  { id: 'nano-banana-pro', name: 'Nano Banana Pro', provider: 'Google', description: 'Photorealistic character and location images. Strong reference consistency.' },
  { id: 'flux2-max-4k-16:9', name: 'FLUX.2 [max] (4K)', provider: 'Black Forest Labs', description: 'Highest quality FLUX. Best for cinematic 4K first frames and key art.' },
  { id: 'flux2-pro-4k', name: 'FLUX.2 [pro] (4K)', provider: 'Black Forest Labs', description: 'Balanced quality and speed. Great for character and location continuity.' },
];

// Video models in the Video Gen dropdown (playground) — launch-ready only
export const videoModels = [
  { id: 'runway-gen4-5', name: 'Runway Gen-4.5', provider: 'Runway', description: 'Cinematic visuals and dramatic lighting. Strong for establishing shots and VFX.' },
  { id: 'runway-gen4-turbo', name: 'Runway Gen-4 Turbo', provider: 'Runway', description: 'Fast generation with high quality. Good for rapid iteration.' },
  { id: 'luma-ray-flash-2', name: 'Luma Ray 2 Flash', provider: 'Luma', description: 'Physics-accurate motion. Fast and natural for action and character movement.' },
  { id: 'luma-ray-2', name: 'Luma Ray 2', provider: 'Luma', description: 'Realistic motion and natural actions. Best for character and scene continuity.' },
  { id: 'veo-2', name: 'Google Veo 2.0', provider: 'Google', description: 'Strong text-to-video. Good for scene establishment and atmosphere.' },
  { id: 'veo-3', name: 'Google Veo 3.0', provider: 'Google', description: 'Advanced motion understanding. High-quality scene generation.' },
  { id: 'veo-3.1', name: 'Google Veo 3.1', provider: 'Google', description: 'Premium quality with audio and dialog. Best for dialogue-heavy scenes.' },
  { id: 'sora-2', name: 'OpenAI Sora 2', provider: 'OpenAI', description: 'Creative and cinematic. Strong for narrative-driven sequences.' },
  { id: 'sora-2-pro', name: 'OpenAI Sora 2 Pro', provider: 'OpenAI', description: 'Higher fidelity Sora. Best for polished, production-ready output.' },
  { id: 'sora-2-pro-hd', name: 'OpenAI Sora 2 Pro HD', provider: 'OpenAI', description: 'Highest resolution Sora. Premium quality for key shots.' },
  { id: 'grok-imagine-video', name: 'xAI Grok Video', provider: 'xAI', description: 'Text and image to video. Good for creative and stylized sequences.' },
];
