/**
 * Scene Builder Utility Functions
 * 
 * Pure helper functions extracted from SceneBuilderPanel for better maintainability.
 * These functions handle shot analysis, character detection, and text processing.
 */

import { SceneAnalysisResult } from '@/types/screenplay';

/**
 * Get full text content from a shot (narration, dialogue, or description)
 */
export function getFullShotText(shot: any): string {
  if (shot.type === 'action' && shot.narrationBlock?.text) return shot.narrationBlock.text;
  if (shot.type === 'dialogue' && shot.dialogueBlock?.dialogue) return shot.dialogueBlock.dialogue;
  return shot.description || '';
}

/**
 * Check if an action shot has explicit character mentions
 */
export function actionShotHasExplicitCharacter(
  shot: any,
  sceneAnalysisResult: SceneAnalysisResult | null
): boolean {
  if (shot.type !== 'action' || !sceneAnalysisResult?.characters) return false;
  const fullText = getFullShotText(shot);
  if (!fullText) return false;
  const textLower = fullText.toLowerCase();
  const originalText = fullText;
  return sceneAnalysisResult.characters.some((char: any) => {
    if (!char.name) return false;
    const charName = char.name.toLowerCase();
    return textLower.includes(charName) || textLower.includes(charName + "'s") || originalText.includes(char.name.toUpperCase());
  });
}

/**
 * Detect pronouns in an action shot
 */
export function actionShotHasPronouns(shot: any): { hasPronouns: boolean; pronouns: string[] } {
  if (shot.type !== 'action') return { hasPronouns: false, pronouns: [] };
  const fullText = getFullShotText(shot);
  if (!fullText) return { hasPronouns: false, pronouns: [] };
  const textLower = fullText.toLowerCase();
  const detectedPronouns: string[] = [];
  const pronounPatterns = { 
    singular: /\b(she|her|hers|he|him|his)\b/g, 
    plural: /\b(they|them|their|theirs)\b/g 
  };
  let match;
  while ((match = pronounPatterns.singular.exec(textLower)) !== null) {
    if (!detectedPronouns.includes(match[0])) detectedPronouns.push(match[0]);
  }
  pronounPatterns.singular.lastIndex = 0;
  while ((match = pronounPatterns.plural.exec(textLower)) !== null) {
    if (!detectedPronouns.includes(match[0])) detectedPronouns.push(match[0]);
  }
  return { hasPronouns: detectedPronouns.length > 0, pronouns: detectedPronouns };
}

/**
 * Extract character mentions from an action shot
 * Uses the same character names from sceneAnalysisResult (which come from backend parsing)
 * and checks if they appear in the action shot text using word boundaries for precision
 * This ensures consistency with the backend's established Fountain parsing
 */
export function getCharactersFromActionShot(
  shot: any,
  sceneAnalysisResult: SceneAnalysisResult | null
): any[] {
  if (shot.type !== 'action' || !sceneAnalysisResult?.characters) return [];
  const fullText = getFullShotText(shot);
  if (!fullText) return [];
  const foundCharacters: any[] = [];
  const foundCharIds = new Set<string>();
  
  // Use characters from sceneAnalysisResult (already extracted by backend using established parser)
  // Check if character names appear in the action shot text
  for (const char of sceneAnalysisResult.characters) {
    if (!char.name || foundCharIds.has(char.id)) continue;
    
    const charName = char.name;
    const charNameUpper = charName.toUpperCase();
    const charNameLower = charName.toLowerCase();
    
    // Escape special regex characters
    const escapedName = charName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const escapedNameUpper = charNameUpper.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const escapedNameLower = charNameLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Check for ALL CAPS mentions (screenplay format - more reliable)
    // Priority 1: Character introduction pattern - name followed by comma or parenthesis
    // Example: "SARAH (30s), sharp eyes..." or "KAT STRATFORD, eighteen, pretty..."
    // This pattern should be checked FIRST because it's more specific and reliable
    // Pattern matches: "SARAH (30s)" or "SARAH, sharp" or "SARAH (30s), sharp"
    const introPattern1 = new RegExp(`^${escapedNameUpper}\\s*[,(]`, 'im'); // Start of line/string, followed by comma or paren
    const introPattern2 = new RegExp(`(?:^|\\s)${escapedNameUpper}\\s*[,(]`, 'i'); // Start of string or whitespace, followed by comma or paren
    // Pattern for name followed by space and parenthesis/comma (most common format)
    const introPattern3 = new RegExp(`${escapedNameUpper}\\s+[,(]`, 'i'); // Name followed by one or more spaces and comma/paren
    // Pattern for name immediately followed by parenthesis (no space, e.g., "SARAH(30s)")
    const introPattern4 = new RegExp(`${escapedNameUpper}[,(]`, 'i'); // Name immediately followed by comma or paren
    if (introPattern1.test(fullText) || introPattern2.test(fullText) || introPattern3.test(fullText) || introPattern4.test(fullText)) {
      foundCharacters.push(char);
      foundCharIds.add(char.id);
      continue;
    }
    
    // Priority 2: Standard word boundary match (handles most other cases)
    const allCapsRegex = new RegExp(`\\b${escapedNameUpper}\\b`, 'i');
    if (allCapsRegex.test(fullText)) {
      foundCharacters.push(char);
      foundCharIds.add(char.id);
      continue;
    }
    
    // Check for regular case matches (word boundaries for precision)
    const charNameRegex = new RegExp(`\\b${escapedName}\\b`, 'i');
    const possessiveRegex = new RegExp(`\\b${escapedNameLower}'s\\b`, 'i');
    if (charNameRegex.test(fullText) || possessiveRegex.test(fullText)) {
      foundCharacters.push(char);
      foundCharIds.add(char.id);
    }
  }
  
  return foundCharacters;
}

/**
 * Get the primary character for a shot (dialogue character or first action character)
 */
export function getCharacterForShot(
  shot: any,
  sceneAnalysisResult: SceneAnalysisResult | null
): any | null {
  if (shot.type === 'dialogue' && shot.characterId && sceneAnalysisResult?.characters) {
    return sceneAnalysisResult.characters.find((c: any) => c.id === shot.characterId);
  }
  if (shot.type === 'action') {
    const chars = getCharactersFromActionShot(shot, sceneAnalysisResult);
    return chars.length > 0 ? chars[0] : null;
  }
  return null;
}

/**
 * Check if a shot needs a location angle
 */
export function needsLocationAngle(
  shot: any,
  sceneAnalysisResult: SceneAnalysisResult | null
): boolean {
  return shot.type === 'establishing' || 
         !!(shot.type === 'action' && sceneAnalysisResult?.location?.id) ||
         !!(shot.type === 'dialogue' && sceneAnalysisResult?.location?.id);
}

/**
 * Check if a location angle is required (not optional)
 * All shots with locations are required unless user opts out
 */
export function isLocationAngleRequired(shot: any, sceneAnalysisResult: SceneAnalysisResult | null): boolean {
  // All shots that need a location angle are required (unless opted out)
  return needsLocationAngle(shot, sceneAnalysisResult);
}

/**
 * Extract available outfits from character headshots if not already set
 */
export function getCharacterWithExtractedOutfits(
  charId: string,
  char: any,
  characterHeadshots: Record<string, Array<{ outfitName?: string; metadata?: { outfitName?: string } }>>
): any {
  if (char.availableOutfits && char.availableOutfits.length > 0) return char;
  const headshots = characterHeadshots[charId] || [];
  const outfitSet = new Set<string>();
  headshots.forEach((headshot: any) => {
    const outfitName = headshot.outfitName || headshot.metadata?.outfitName;
    if (outfitName && outfitName !== 'default') outfitSet.add(outfitName);
  });
  const extractedOutfits = Array.from(outfitSet).sort();
  if (extractedOutfits.length > 0) {
    return { ...char, availableOutfits: extractedOutfits };
  }
  return char;
}

/**
 * Detect if scene description contains dialogue
 */
export function detectDialogue(text: string): { hasDialogue: boolean; characterName?: string; dialogue?: string } {
  const trimmed = text.trim();
  if (!trimmed) return { hasDialogue: false };
  
  // Method 1: Screenplay format - CHARACTER NAME followed by dialogue
  const screenplayRegex = /\n\s*([A-Z\s]{2,})\n\s*([^\n]+)/;
  const screenplayMatch = trimmed.match(screenplayRegex);
  if (screenplayMatch) {
    const speaker = screenplayMatch[1].trim();
    const dialogue = screenplayMatch[2].trim();
    // Filter out sluglines
    if (!dialogue.match(/^(INT\.|EXT\.|FADE|CUT TO|DISSOLVE)/i)) {
      return { hasDialogue: true, characterName: speaker, dialogue };
    }
  }
  
  // Method 2: Quoted dialogue - "dialog text" or 'dialog text'
  const quotedRegex = /["']([^"']{10,})["']/;
  const quotedMatch = trimmed.match(quotedRegex);
  if (quotedMatch) {
    return { hasDialogue: true, dialogue: quotedMatch[1].trim() };
  }
  
  // Method 3: Says/speaks pattern
  const saysRegex = /(\w+)\s+(says?|speaks?|yells?|shouts?|whispers?)[:\s]+["']?([^"'\n.]{10,})["']?/i;
  const saysMatch = trimmed.match(saysRegex);
  if (saysMatch) {
    return { hasDialogue: true, characterName: saysMatch[1].trim(), dialogue: saysMatch[3].trim() };
  }
  
  // Method 4: Colon format - "CHARACTER: dialog text"
  const colonRegex = /(\w+):\s*["']?([^"\n]{10,})["']?/;
  const colonMatch = trimmed.match(colonRegex);
  if (colonMatch) {
    return { hasDialogue: true, characterName: colonMatch[1].trim(), dialogue: colonMatch[2].trim() };
  }
  
  return { hasDialogue: false };
}

/**
 * Find a character by ID from multiple possible sources
 * Priority: allCharacters > sceneAnalysisResult.characters
 */
export function findCharacterById(
  charId: string,
  allCharacters: any[],
  sceneAnalysisResult: SceneAnalysisResult | null
): any | null {
  if (!charId) return null;
  
  // Try allCharacters first (usually more complete)
  const fromAllChars = allCharacters.find((c: any) => c.id === charId);
  if (fromAllChars) return fromAllChars;
  
  // Fallback to sceneAnalysisResult
  return sceneAnalysisResult?.characters?.find((c: any) => c.id === charId) || null;
}

/**
 * Get character name by ID with fallback
 * Returns character name or fallback text
 */
export function getCharacterName(
  charId: string,
  allCharacters: any[],
  sceneAnalysisResult: SceneAnalysisResult | null,
  fallback: string = 'Character'
): string {
  const char = findCharacterById(charId, allCharacters, sceneAnalysisResult);
  return char?.name || fallback;
}

/**
 * Get the character source array (allCharacters or sceneAnalysisResult.characters)
 * Prioritizes allCharacters if available, falls back to sceneAnalysisResult.characters
 */
export function getCharacterSource(
  allCharacters: any[],
  sceneAnalysisResult: SceneAnalysisResult | null
): any[] {
  // 🔥 FIX: Deduplicate characters by ID to prevent duplicates in dropdown
  const source = allCharacters.length > 0 ? allCharacters : (sceneAnalysisResult?.characters || []);
  const seen = new Set<string>();
  return source.filter(char => {
    if (!char?.id) return false;
    if (seen.has(char.id)) return false;
    seen.add(char.id);
    return true;
  });
}

/**
 * Get shot-specific character reference
 * Helper to safely access selectedCharacterReferences[shotSlot][charId]
 */
export function getShotCharacterReference(
  shotSlot: number,
  charId: string,
  selectedCharacterReferences: Record<number, Record<string, { poseId?: string; s3Key?: string; imageUrl?: string }>>
): { poseId?: string; s3Key?: string; imageUrl?: string } | undefined {
  return selectedCharacterReferences[shotSlot]?.[charId];
}

/**
 * Get shot-specific location reference
 * Helper to safely access selectedLocationReferences[shotSlot]
 */
export function getShotLocationReference(
  shotSlot: number,
  selectedLocationReferences: Record<number, { angleId?: string; s3Key?: string; imageUrl?: string }>
): { angleId?: string; s3Key?: string; imageUrl?: string } | undefined {
  return selectedLocationReferences[shotSlot];
}

