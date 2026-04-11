import { stripFountainInlineStyleMarkers } from './stripFountainInlineStyleMarkers';

const LANE_CAPS = {
  story_advisor: 2400,
  screenwriter: 1600,
  director: 1200,
  rewrite: 900,
  dialogue: 800
};

const MAX_CHARACTERS_PER_BLOCK = 4;
const MAX_PROPS_PER_BLOCK = 6;
const MAX_CHARACTER_LINE_CHARS = 260;
const MAX_PROP_LINE_CHARS = 80;
const MAX_LOCATION_CHARS = 420;

function normalizeText(value) {
  if (typeof value !== 'string') return '';
  return stripFountainInlineStyleMarkers(value).replace(/\s+/g, ' ').trim();
}

function truncateText(value, maxChars) {
  if (!value) return '';
  if (value.length <= maxChars) return value;
  return `${value.slice(0, Math.max(0, maxChars - 3)).trimEnd()}...`;
}

function parseEnvBoolean(value, fallback = true) {
  if (value === undefined || value === null || value === '') return fallback;
  const normalized = String(value).trim().toLowerCase();
  if (['0', 'false', 'off', 'no'].includes(normalized)) return false;
  if (['1', 'true', 'on', 'yes'].includes(normalized)) return true;
  return fallback;
}

export function isEnrichedAgentContextEnabled() {
  return parseEnvBoolean(process.env.NEXT_PUBLIC_ENABLE_ENRICHED_AGENT_CONTEXT, true);
}

function getLaneCap(lane) {
  return LANE_CAPS[lane] || 1000;
}

function firstSentence(value) {
  const normalized = normalizeText(value);
  if (!normalized) return '';
  const parts = normalized.split(/[.!?]+/).map((item) => item.trim()).filter(Boolean);
  if (!parts.length) return '';
  return `${parts[0]}.`;
}

function findCurrentSceneRecord(scenes, sceneContext) {
  if (!Array.isArray(scenes) || !sceneContext) return null;
  const heading = normalizeText(sceneContext.heading || '');
  const startLine = Number.isFinite(sceneContext.startLine) ? sceneContext.startLine : null;
  const endLine = Number.isFinite(sceneContext.endLine) ? sceneContext.endLine : null;

  let bestScene = null;
  let bestScore = -1;

  scenes.forEach((scene) => {
    if (!scene || !scene.fountain) return;
    const sceneStart = Number.isFinite(scene.fountain.startLine) ? scene.fountain.startLine : null;
    const sceneEnd = Number.isFinite(scene.fountain.endLine) ? scene.fountain.endLine : null;
    let score = 0;

    if (heading && normalizeText(scene.heading || '') === heading) {
      score += 3;
    }
    if (startLine !== null && endLine !== null && sceneStart !== null && sceneEnd !== null) {
      const overlaps = sceneStart <= endLine && sceneEnd >= startLine;
      if (overlaps) score += 4;
      const distance = Math.abs(sceneStart - startLine) + Math.abs(sceneEnd - endLine);
      score += Math.max(0, 2 - Math.floor(distance / 20));
    }

    if (score > bestScore) {
      bestScore = score;
      bestScene = scene;
    }
  });

  return bestScene;
}

function formatSceneCoreBlock(sceneContext) {
  if (!sceneContext) return '';
  const heading = normalizeText(sceneContext.heading || '');
  const sceneChars = Array.isArray(sceneContext.characters)
    ? sceneContext.characters.map((name) => normalizeText(String(name || ''))).filter(Boolean)
    : [];
  const lines = [];
  if (heading) lines.push(`Scene: ${heading}`);
  if (sceneContext.act) lines.push(`Act: ${sceneContext.act}`);
  if (sceneContext.pageNumber) lines.push(`Page: ${sceneContext.pageNumber}${sceneContext.totalPages ? `/${sceneContext.totalPages}` : ''}`);
  if (sceneChars.length) lines.push(`Scene Characters: ${sceneChars.slice(0, 8).join(', ')}`);
  if (!lines.length) return '';
  return `[SCENE CORE]\n${lines.join('\n')}`;
}

function formatCharacterBlock(sceneCharacters) {
  if (!Array.isArray(sceneCharacters) || !sceneCharacters.length) return '';
  const rows = sceneCharacters
    .slice(0, MAX_CHARACTERS_PER_BLOCK)
    .map((char) => {
      if (!char || !char.name) return '';
      const name = normalizeText(char.name).toUpperCase();
      const role = normalizeText(char.type || 'character');
      const arcStatus = normalizeText(char.arcStatus || '');
      const arcNotes = truncateText(firstSentence(char.arcNotes), 90);
      const description = truncateText(firstSentence(char.description), 90);
      const physical = char.physicalAttributes && typeof char.physicalAttributes === 'object'
        ? Object.entries(char.physicalAttributes)
          .map(([key, val]) => `${key}:${normalizeText(String(val || ''))}`)
          .filter((item) => item && !item.endsWith(':'))
          .slice(0, 3)
          .join(', ')
        : '';
      const fields = [
        role ? `Role ${role}` : '',
        arcStatus ? `Arc ${arcStatus}` : '',
        arcNotes ? `Notes ${arcNotes}` : '',
        description ? `Trait ${description}` : '',
        physical ? `Physical ${physical}` : ''
      ].filter(Boolean);
      if (!fields.length) return `${name}`;
      return truncateText(`${name}: ${fields.join(' | ')}`, MAX_CHARACTER_LINE_CHARS);
    })
    .filter(Boolean);

  if (!rows.length) return '';
  return `[CHARACTER DOSSIERS]\n${rows.join('\n')}`;
}

function formatLocationBlock(location) {
  if (!location) return '';
  const lines = [
    normalizeText(location.name || ''),
    normalizeText(location.type || ''),
    firstSentence(location.description),
    firstSentence(location.atmosphereNotes),
    firstSentence(location.setRequirements)
  ].filter(Boolean);
  if (!lines.length) return '';
  return `[LOCATION PROFILE - CURRENT SCENE]\n${truncateText(lines.join(' | '), MAX_LOCATION_CHARS)}`;
}

function formatPropsBlock(props) {
  if (!Array.isArray(props) || !props.length) return '';
  const rows = props
    .slice(0, MAX_PROPS_PER_BLOCK)
    .map((asset) => {
      if (!asset || !asset.name) return '';
      const name = normalizeText(asset.name);
      const category = normalizeText(asset.category || '');
      const description = firstSentence(asset.description);
      const line = [name, category, description].filter(Boolean).join(' | ');
      return truncateText(line, MAX_PROP_LINE_CHARS);
    })
    .filter(Boolean);
  if (!rows.length) return '';
  return `[SCENE PROPS - LINKED ONLY]\n${rows.map((row) => `- ${row}`).join('\n')}`;
}

function buildBoundedContext(blocks, cap) {
  const included = [];
  let used = 0;
  blocks.forEach((block) => {
    if (!block || !block.text) return;
    const separator = included.length ? '\n\n' : '';
    const blockChars = block.text.length + separator.length;
    if (used + blockChars <= cap) {
      included.push(block.text);
      used += blockChars;
      return;
    }
    if (!block.allowTrim) return;
    const remaining = cap - used - separator.length;
    if (remaining < 80) return;
    included.push(truncateText(block.text, remaining));
    used = cap;
  });
  const text = included.join('\n\n');
  return {
    text,
    usedChars: text.length
  };
}

export function buildEnrichedAgentContext(input) {
  const lane = normalizeText(input?.lane || 'screenwriter').toLowerCase();
  const enabled = isEnrichedAgentContextEnabled();
  if (!enabled) {
    return {
      text: '',
      metrics: {
        lane,
        enabled: false,
        capChars: getLaneCap(lane),
        totalChars: 0,
        maxedOut: false
      }
    };
  }

  const sceneContext = input?.sceneContext || null;
  const scenes = Array.isArray(input?.scenes) ? input.scenes : [];
  const characters = Array.isArray(input?.characters) ? input.characters : [];
  const locations = Array.isArray(input?.locations) ? input.locations : [];
  const assets = Array.isArray(input?.assets) ? input.assets : [];

  const currentSceneRecord = findCurrentSceneRecord(scenes, sceneContext);
  const sceneCharacterIds = currentSceneRecord?.fountain?.tags?.characters || [];
  const sceneCharacters = sceneCharacterIds.length
    ? sceneCharacterIds.map((id) => characters.find((char) => char.id === id)).filter(Boolean)
    : characters.filter((char) => sceneContext?.characters?.some((name) => normalizeText(name).toLowerCase() === normalizeText(char?.name || '').toLowerCase()));
  const locationId = currentSceneRecord?.fountain?.tags?.location;
  const currentLocation = locationId ? locations.find((loc) => loc.id === locationId) : null;
  const propIds = currentSceneRecord?.fountain?.tags?.props || [];
  const sceneAssets = propIds
    .map((propId) => assets.find((asset) => asset.id === propId))
    .filter(Boolean);

  const blocks = [
    { key: 'sceneCore', text: formatSceneCoreBlock(sceneContext), allowTrim: false },
    { key: 'characters', text: formatCharacterBlock(sceneCharacters), allowTrim: true },
    { key: 'location', text: formatLocationBlock(currentLocation), allowTrim: true },
    { key: 'props', text: formatPropsBlock(sceneAssets), allowTrim: true }
  ].filter((block) => block.text);

  const capChars = getLaneCap(lane);
  const bounded = buildBoundedContext(blocks, capChars);

  return {
    text: bounded.text,
    metrics: {
      lane,
      enabled: true,
      capChars,
      totalChars: bounded.usedChars,
      maxedOut: bounded.usedChars >= capChars,
      blockCount: blocks.length,
      sceneId: currentSceneRecord?.id || null
    }
  };
}
