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
  { id: 'grok-4.20-0309-reasoning', name: 'Grok 4.20', provider: 'xAI', description: 'Advanced reasoning model with 2M context. Best for deep analysis and planning.' },
  { id: 'grok-4-1-fast-reasoning', name: 'Grok 4.1 Fast', provider: 'xAI', description: 'Low latency with reasoning for fast analysis loops.' },
  { id: 'grok-4-1-fast-non-reasoning', name: 'Grok 4.1 Fast Lite', provider: 'xAI', description: 'Speed-prioritized fast mode for lightweight drafting and rewrites.' },
];

// Image models exposed across Scene Builder and image generation tools
export const imageModels = [
  { id: 'nano-banana-pro', name: 'Nano Banana Pro', provider: 'Google', description: 'Google DeepMind image model. Up to 2K native, 4K upscale. Strong text rendering, up to 14 reference images.' },
  { id: 'gemini-3.1-flash-image', name: 'Nano Banana Pro2', provider: 'Google', description: 'Gemini 3.1 Flash Image model. Standard and premium resolution tiers, strong editing/text rendering, up to 14 reference images in Wryda workflows.' },
  { id: 'flux2-max', name: 'FLUX.2 [max]', provider: 'Black Forest Labs', description: 'Top-tier FLUX.2 model. 2K/4K tiers, character consistency, up to 10 refs. Cinematic visuals and production typography.' },
  { id: 'flux2-pro', name: 'FLUX.2 [pro]', provider: 'Black Forest Labs', description: 'Production-grade FLUX.2 model. 2K/4K tiers, up to 8-10 refs. Photorealistic detail, hex color control, spatial reasoning.' },
  { id: 'grok-imagine-image', name: 'Grok Imagine (Standard)', provider: 'xAI', description: 'Fast text-to-image and editing model. Supports up to 3 input images for edits, 2K output, and higher throughput (300 RPM).' },
  { id: 'grok-imagine-image-pro', name: 'Grok Imagine Pro', provider: 'xAI', description: 'Higher-tier Grok Imagine for quality-focused shots. Supports text+image editing, 2K output, with lower-volume premium throughput (30 RPM).' },
];

// Video models in the Video Gen dropdown (playground) — launch-ready only
export const videoModels = [
  { id: 'ltx-2.3-fast', name: 'LTX 2.3 Fast', provider: 'Lightricks', description: 'Optimized for fast, lower-cost text/image-to-video iteration; supports longer 1080p durations up to 20s.' },
  { id: 'ltx-2.3-pro', name: 'LTX 2.3 Pro', provider: 'Lightricks', description: 'Higher-fidelity LTX output with improved motion stability and detail; required for audio-to-video, retake, and extend workflows.' },
  { id: 'runway-gen4-5', name: 'Runway Gen-4.5', provider: 'Runway', description: 'Top-rated text-to-video. Cinematic, photorealistic. Physics-accurate motion, fine detail preservation.' },
  { id: 'runway-gen4-turbo', name: 'Runway Gen-4 Turbo', provider: 'Runway', description: 'Fast image-to-video. ~5x faster than Gen-4. 10-second clips in ~30 seconds.' },
  { id: 'luma-ray-flash-2', name: 'Luma Ray 2 Flash', provider: 'Luma', description: 'Faster, ~1/3 cost of Ray 2. Natural motion, keyframes, up to 9 seconds at 4K.' },
  { id: 'luma-ray-2', name: 'Luma Ray 2', provider: 'Luma', description: 'Photorealistic video from text. 5–10 sec clips, keyframes, camera controls. 4K upscale.' },
  { id: 'veo-3.1', name: 'Google Veo 3.1 (Quality)', provider: 'Google', description: 'Highest quality. Native audio, lip-sync, multi-person dialogue. Reference images, scene extension.' },
  { id: 'veo-3.1-fast', name: 'Google Veo 3.1 Fast', provider: 'Google', description: 'Faster generation, slightly lower quality. Native audio, reference images, scene extension.' },
  { id: 'grok-imagine-video', name: 'xAI Grok Video', provider: 'xAI', description: 'Text and image to video. Editing, restyling, motion control. Up to 10 sec with audio.' },
];
