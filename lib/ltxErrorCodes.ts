export const LTX_ERROR_CODES = {
  EXPERIMENT_DISABLED: 'LTX_EXPERIMENT_DISABLED',
  MULTI_CHARACTER_UNSUPPORTED: 'LTX_MULTI_CHARACTER_UNSUPPORTED',
  UNSUPPORTED_ASPECT_RATIO: 'LTX_UNSUPPORTED_ASPECT_RATIO',
  CONFIG_MISSING_API_KEY: 'LTX_CONFIG_MISSING_API_KEY',
  FIRST_FRAME_REQUIRED: 'LTX_FIRST_FRAME_REQUIRED',
  DIALOGUE_REQUIRED: 'LTX_DIALOGUE_REQUIRED',
  DIALOGUE_CONTEXT_REQUIRED: 'LTX_DIALOGUE_CONTEXT_REQUIRED',
  ACTIVE_VOICE_PROFILE_REQUIRED: 'LTX_ACTIVE_VOICE_PROFILE_REQUIRED',
  VOICE_ID_REQUIRED: 'LTX_VOICE_ID_REQUIRED',
  TTS_AUDIO_URL_MISSING: 'LTX_TTS_AUDIO_URL_MISSING',
  PRICING_KEY_MISSING: 'LTX_PRICING_KEY_MISSING',
  API_UNAUTHORIZED: 'LTX_API_UNAUTHORIZED',
  API_FORBIDDEN: 'LTX_API_FORBIDDEN',
  API_RATE_LIMITED: 'LTX_API_RATE_LIMITED',
  API_UPSTREAM_ERROR: 'LTX_API_UPSTREAM_ERROR',
  API_REQUEST_FAILED: 'LTX_API_REQUEST_FAILED',
  IMAGE_URL_REQUIRED: 'LTX_IMAGE_URL_REQUIRED',
} as const;

export type LtxErrorCode = (typeof LTX_ERROR_CODES)[keyof typeof LTX_ERROR_CODES];

const LTX_ERROR_MESSAGE_MAP: Record<LtxErrorCode, string> = {
  [LTX_ERROR_CODES.EXPERIMENT_DISABLED]: 'LTX test is currently disabled in this environment.',
  [LTX_ERROR_CODES.MULTI_CHARACTER_UNSUPPORTED]: 'LTX test currently supports single-character dialogue shots only.',
  [LTX_ERROR_CODES.UNSUPPORTED_ASPECT_RATIO]: 'LTX test currently supports only 16:9 or 9:16.',
  [LTX_ERROR_CODES.CONFIG_MISSING_API_KEY]: 'LTX is not configured yet. Please contact support.',
  [LTX_ERROR_CODES.FIRST_FRAME_REQUIRED]: 'LTX test requires a first frame image.',
  [LTX_ERROR_CODES.DIALOGUE_REQUIRED]: 'LTX test requires dialogue text.',
  [LTX_ERROR_CODES.DIALOGUE_CONTEXT_REQUIRED]: 'LTX test requires screenplay and character context.',
  [LTX_ERROR_CODES.ACTIVE_VOICE_PROFILE_REQUIRED]: 'An active voice profile is required for LTX test.',
  [LTX_ERROR_CODES.VOICE_ID_REQUIRED]: 'Selected voice profile is missing an ElevenLabs voice id.',
  [LTX_ERROR_CODES.TTS_AUDIO_URL_MISSING]: 'Voice generation failed before LTX request. Please try again.',
  [LTX_ERROR_CODES.PRICING_KEY_MISSING]: 'LTX pricing is not configured correctly for this request.',
  [LTX_ERROR_CODES.API_UNAUTHORIZED]: 'LTX authorization failed. Please contact support.',
  [LTX_ERROR_CODES.API_FORBIDDEN]: 'LTX request was forbidden. Please contact support.',
  [LTX_ERROR_CODES.API_RATE_LIMITED]: 'LTX is rate-limited right now. Please retry shortly.',
  [LTX_ERROR_CODES.API_UPSTREAM_ERROR]: 'LTX service is temporarily unavailable. Please retry.',
  [LTX_ERROR_CODES.API_REQUEST_FAILED]: 'LTX request failed. Please retry.',
  [LTX_ERROR_CODES.IMAGE_URL_REQUIRED]: 'LTX image-to-video requires a source image.',
};

export function extractBracketedErrorCode(raw: unknown): string | undefined {
  const text = typeof raw === 'string' ? raw : '';
  const match = text.match(/\[([A-Z0-9_]+)\]/);
  return match?.[1];
}

export function getLtxErrorMessageByCode(code: string | undefined): string | null {
  if (!code) return null;
  const key = code as LtxErrorCode;
  return LTX_ERROR_MESSAGE_MAP[key] || null;
}
