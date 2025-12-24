/**
 * Character Categorization Utilities
 * 
 * Helper functions to organize characters by category:
 * - Explicit: Characters mentioned directly in action lines (e.g., "Sarah")
 * - Singular Pronoun: Characters mapped via singular pronouns (e.g., "she" → SARAH)
 * - Plural Pronoun: Characters mapped via plural pronouns (e.g., "they" → [SARAH, RIVERA])
 */

export interface CharacterCategorization {
  explicitCharacters: string[];
  singularPronounCharacters: string[];
  pluralPronounCharacters: string[];
}

export function categorizeCharacters(
  shot: any,
  shotMappings: Record<string, string | string[]>,
  getCharactersFromActionShot: (shot: any) => any[],
  getCharacterForShot: (shot: any) => any
): CharacterCategorization {
  const explicitCharacters: string[] = [];
  const singularPronounCharacters: string[] = [];
  const pluralPronounCharacters: string[] = [];
  
  // Get explicit characters from action lines or dialogue
  if (shot.type === 'action') {
    const explicitChars = getCharactersFromActionShot(shot);
    explicitCharacters.push(...explicitChars.map((c: any) => c.id));
  } else if (shot.type === 'dialogue') {
    const char = getCharacterForShot(shot);
    if (char?.id) {
      explicitCharacters.push(char.id);
    }
  }
  
  // Categorize pronoun-mapped characters
  const singularPronouns = ['she', 'her', 'hers', 'he', 'him', 'his'];
  const pluralPronouns = ['they', 'them', 'their', 'theirs'];
  
  Object.entries(shotMappings).forEach(([pronoun, mappedIdOrIds]) => {
    const pronounLower = pronoun.toLowerCase();
    if (singularPronouns.includes(pronounLower) && !Array.isArray(mappedIdOrIds) && mappedIdOrIds) {
      if (!singularPronounCharacters.includes(mappedIdOrIds)) {
        singularPronounCharacters.push(mappedIdOrIds);
      }
    } else if (pluralPronouns.includes(pronounLower) && Array.isArray(mappedIdOrIds)) {
      mappedIdOrIds.forEach(id => {
        if (!pluralPronounCharacters.includes(id)) {
          pluralPronounCharacters.push(id);
        }
      });
    }
  });
  
  return {
    explicitCharacters,
    singularPronounCharacters,
    pluralPronounCharacters
  };
}

