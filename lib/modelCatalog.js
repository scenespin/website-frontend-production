/**
 * Canonical UI-exposed model catalog for the public Models page.
 * Only models actually exposed in the Wryda UI.
 *
 * - LLMs: Editor (Story Advisor, Character, Location agents + modals + Model Selector)
 * - Image: UI-exposed image models (Scene Builder, selectors, and image generation tools)
 * - Video: All models in the Video Gen dropdown (playground)
 */

export const llmModels = [
  // Anthropic
  { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6', provider: 'Anthropic', description: 'Anthropic\'s most capable Sonnet. Strong at creative writing, coding, and agent planning. 1M token context in beta.' },
  { id: 'claude-opus-4-6', name: 'Claude Opus 4.6', provider: 'Anthropic', description: 'Anthropic\'s most capable model. Adaptive thinking, 1M context, leads on complex reasoning benchmarks.' },
  { id: 'claude-haiku-4-5', name: 'Claude Haiku 4.5', provider: 'Anthropic', description: 'Fastest and most cost-efficient Claude. Near-frontier performance for real-time and high-volume use.' },
  // OpenAI
  { id: 'gpt-5.1', name: 'GPT-5.1', provider: 'OpenAI', description: 'Warmer, more conversational. Adaptive reasoning that decides when extended thinking is needed.' },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', description: 'Multimodal flagship (text, audio, image, video). Fast, strong vision and instruction following.' },
  { id: 'o3', name: 'O3', provider: 'OpenAI', description: 'Reasoning-focused. Step-by-step logic for complex coding, math, and science. Agentic tool use.' },
  // Google
  { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro', provider: 'Google', description: 'Google\'s most intelligent model. Natively multimodal, 1M context, state-of-the-art reasoning.' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'Google', description: 'Advanced reasoning with thinking. Excels at complex code, math, STEM, and long-context analysis.' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Google', description: 'Best price/performance. First Flash with thinking. Fast, well-rounded, multimodal.' },
  // xAI
  { id: 'grok-4-0709', name: 'Grok 4', provider: 'xAI', description: 'xAI\'s most advanced model. Multimodal (text, image, video), tool use, real-time search. 1M context.' },
  { id: 'grok-4-1-fast-reasoning', name: 'Grok 4.1 Fast', provider: 'xAI', description: 'Low latency with reasoning. Reasoning mode for complex analysis; activates deeper planning and tool coordination.' },
  { id: 'grok-4-1-fast-non-reasoning', name: 'Grok 4.1 Fast Lite', provider: 'xAI', description: 'Speed-prioritized, non-reasoning mode. ~3x fewer hallucinations than prior versions.' },
];

// Image models exposed across Scene Builder and image generation tools
export const imageModels = [
  { id: 'nano-banana-pro', name: 'Nano Banana Pro', provider: 'Google', description: 'Google DeepMind image model. Up to 2K native, 4K upscale. Strong text rendering, up to 14 reference images.' },
  { id: 'gemini-3.1-flash-image-2k', name: 'Nano Banana Pro2 (2K)', provider: 'Google', description: 'Gemini 3.1 Flash Image variant tuned for faster standard-tier output. Strong editing, text rendering, and up to 14 reference images in Wryda workflows.' },
  { id: 'gemini-3.1-flash-image-4k', name: 'Nano Banana Pro2 (4K)', provider: 'Google', description: 'Gemini 3.1 Flash Image variant. High-fidelity 4K output, strong editing and text rendering, up to 14 reference images in Wryda workflows.' },
  { id: 'flux2-max-4k-16:9', name: 'FLUX.2 [max] (4K)', provider: 'Black Forest Labs', description: 'Top-tier FLUX.2. 4MP output, character consistency, 10 refs. Cinematic visuals, production typography.' },
  { id: 'flux2-pro-4k', name: 'FLUX.2 [pro] (4K)', provider: 'Black Forest Labs', description: 'Production-grade. 4MP, up to 8–10 refs. Photorealistic detail, hex color control, spatial reasoning.' },
  { id: 'grok-imagine-image', name: 'Grok Imagine (Standard)', provider: 'xAI', description: 'Fast text-to-image and editing model. Supports up to 3 input images for edits, 1k/2k output, and higher throughput (300 RPM).' },
  { id: 'grok-imagine-image-pro', name: 'Grok Imagine Pro', provider: 'xAI', description: 'Higher-tier Grok Imagine for quality-focused shots. Supports text+image editing, 1k/2k output, with lower-volume premium throughput (30 RPM).' },
];

// Video models in the Video Gen dropdown (playground) — launch-ready only
export const videoModels = [
  { id: 'runway-gen4-5', name: 'Runway Gen-4.5', provider: 'Runway', description: 'Top-rated text-to-video. Cinematic, photorealistic. Physics-accurate motion, fine detail preservation.' },
  { id: 'runway-gen4-turbo', name: 'Runway Gen-4 Turbo', provider: 'Runway', description: 'Fast image-to-video. ~5x faster than Gen-4. 10-second clips in ~30 seconds.' },
  { id: 'luma-ray-flash-2', name: 'Luma Ray 2 Flash', provider: 'Luma', description: 'Faster, ~1/3 cost of Ray 2. Natural motion, keyframes, up to 9 seconds at 4K.' },
  { id: 'luma-ray-2', name: 'Luma Ray 2', provider: 'Luma', description: 'Photorealistic video from text. 5–10 sec clips, keyframes, camera controls. 4K upscale.' },
  { id: 'veo-2', name: 'Google Veo 2.0', provider: 'Google', description: 'Text-to-video with sound. Strong for scene establishment and atmosphere.' },
  { id: 'veo-3', name: 'Google Veo 3.0', provider: 'Google', description: 'Text-to-video with sound. 4–8 sec, 1080p. Improved motion and quality.' },
  { id: 'veo-3.1', name: 'Google Veo 3.1 (Quality)', provider: 'Google', description: 'Highest quality. Native audio, lip-sync, multi-person dialogue. Reference images, scene extension.' },
  { id: 'veo-3.1-fast', name: 'Google Veo 3.1 Fast', provider: 'Google', description: 'Faster generation, slightly lower quality. Native audio, reference images, scene extension.' },
  { id: 'sora-2', name: 'OpenAI Sora 2', provider: 'OpenAI', description: 'Physics-accurate motion, synchronized audio. Realistic, cinematic, anime styles.' },
  { id: 'sora-2-pro', name: 'OpenAI Sora 2 Pro', provider: 'OpenAI', description: 'Up to 60 sec, 4K. Timeline editor, scene linking. Production-grade output.' },
  { id: 'sora-2-pro-hd', name: 'OpenAI Sora 2 Pro HD', provider: 'OpenAI', description: 'Highest resolution Sora. 1024x1792, 1792x1024. Premium for key shots.' },
  { id: 'grok-imagine-video', name: 'xAI Grok Video', provider: 'xAI', description: 'Text and image to video. Editing, restyling, motion control. Up to 10 sec with audio.' },
];
