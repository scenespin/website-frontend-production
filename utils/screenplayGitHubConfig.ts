export type ScreenplayGitHubConfig = {
  owner: string;
  repo: string;
  branch?: string;
};

const GLOBAL_GITHUB_CONFIG_KEY = 'screenplay_github_config';
const SCREENPLAY_GITHUB_CONFIG_PREFIX = 'screenplay_github_config_';

function isValidScreenplayId(screenplayId?: string | null): screenplayId is string {
  return typeof screenplayId === 'string' && screenplayId.startsWith('screenplay_');
}

function getScreenplayScopedKey(screenplayId?: string | null): string {
  if (isValidScreenplayId(screenplayId)) {
    return `${SCREENPLAY_GITHUB_CONFIG_PREFIX}${screenplayId}`;
  }
  return GLOBAL_GITHUB_CONFIG_KEY;
}

function parseConfig(raw: string | null): ScreenplayGitHubConfig | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as {
      owner?: string;
      repo?: string;
      branch?: string;
    };
    if (typeof parsed.owner !== 'string' || !parsed.owner.trim()) return null;
    if (typeof parsed.repo !== 'string' || !parsed.repo.trim()) return null;
    return {
      owner: parsed.owner.trim(),
      repo: parsed.repo.trim(),
      branch: typeof parsed.branch === 'string' && parsed.branch.trim() ? parsed.branch.trim() : undefined,
    };
  } catch {
    return null;
  }
}

export function readStoredScreenplayGitHubConfig(screenplayId?: string | null): ScreenplayGitHubConfig | null {
  if (typeof window === 'undefined') return null;
  const scoped = parseConfig(localStorage.getItem(getScreenplayScopedKey(screenplayId)));
  if (scoped) return scoped;
  return parseConfig(localStorage.getItem(GLOBAL_GITHUB_CONFIG_KEY));
}

export function writeStoredScreenplayGitHubConfig(
  config: ScreenplayGitHubConfig,
  screenplayId?: string | null
): void {
  if (typeof window === 'undefined') return;
  const serialized = JSON.stringify(config);
  localStorage.setItem(GLOBAL_GITHUB_CONFIG_KEY, serialized);
  if (isValidScreenplayId(screenplayId)) {
    localStorage.setItem(getScreenplayScopedKey(screenplayId), serialized);
  }
}

export function clearStoredScreenplayGitHubConfig(screenplayId?: string | null): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(GLOBAL_GITHUB_CONFIG_KEY);
  if (isValidScreenplayId(screenplayId)) {
    localStorage.removeItem(getScreenplayScopedKey(screenplayId));
  }
}
