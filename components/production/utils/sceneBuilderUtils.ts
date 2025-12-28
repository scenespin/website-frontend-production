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
    // Use word boundaries to ensure we match complete names, not substrings
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

