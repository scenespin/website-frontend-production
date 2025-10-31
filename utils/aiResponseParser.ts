/**
 * Parse AI-generated structured responses for entity creation
 */

export interface ParsedCharacter {
  name: string;
  type: 'lead' | 'supporting' | 'minor';
  arcStatus: 'introduced' | 'developing' | 'resolved';
  description: string;
  arcNotes: string;
}

export interface ParsedLocation {
  name: string;
  type: 'INT' | 'EXT' | 'INT/EXT';
  description: string;
  address?: string;
  atmosphereNotes?: string;
  setRequirements?: string;
  productionNotes?: string;
}

export interface ParsedScene {
  number: number;
  heading: string;
  synopsis: string;
  status: 'draft' | 'review' | 'final';
}

/**
 * Parse character profile from AI response
 */
export function parseCharacterProfile(aiResponse: string): Partial<ParsedCharacter> | null {
  try {
    const parsed: Partial<ParsedCharacter> = {};
    
    // Extract name (look for patterns like "Name: X" or first line with a name)
    const nameMatch = aiResponse.match(/(?:Name|Character|^)[\s:]*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/im);
    if (nameMatch && nameMatch[1]) {
      parsed.name = nameMatch[1].trim();
    }
    
    // Extract type (lead/protagonist, supporting, minor)
    if (/protagonist|lead|main\s+character|hero|heroine/i.test(aiResponse)) {
      parsed.type = 'lead';
    } else if (/supporting|secondary/i.test(aiResponse)) {
      parsed.type = 'supporting';
    } else if (/minor|background/i.test(aiResponse)) {
      parsed.type = 'minor';
    }
    
    // Extract description (look for Physical Introduction or Description sections)
    const descriptionMatch = aiResponse.match(/(?:Physical Introduction|Description|Appearance)[\s:]*\n([^\n]+(?:\n[^\n#*]+)*)/i);
    if (descriptionMatch && descriptionMatch[1]) {
      parsed.description = descriptionMatch[1].trim();
    } else {
      // Fallback: get the first substantial paragraph
      const paragraphs = aiResponse.split('\n\n').filter(p => p.trim().length > 50);
      if (paragraphs.length > 0) {
        parsed.description = paragraphs[0].trim();
      }
    }
    
    // Extract arc notes (look for Character Arc, Background, etc.)
    const arcMatch = aiResponse.match(/(?:Character Arc|Arc Potential|Background|Personality Essence)[\s:]*\n([^\n]+(?:\n[^\n#*]+)*)/i);
    if (arcMatch && arcMatch[1]) {
      parsed.arcNotes = arcMatch[1].trim();
    } else {
      // Fallback: combine relevant sections
      const sections = [];
      const personalityMatch = aiResponse.match(/Personality(?:\s+Essence)?[\s:]*\n([^\n]+)/i);
      const goalsMatch = aiResponse.match(/(?:Goals?|What they want)[\s:]*\n([^\n]+)/i);
      const flawsMatch = aiResponse.match(/(?:Flaws?|Internal Conflict)[\s:]*\n([^\n]+)/i);
      
      if (personalityMatch) sections.push(personalityMatch[1].trim());
      if (goalsMatch) sections.push(`Goals: ${goalsMatch[1].trim()}`);
      if (flawsMatch) sections.push(`Flaws: ${flawsMatch[1].trim()}`);
      
      if (sections.length > 0) {
        parsed.arcNotes = sections.join('\n\n');
      }
    }
    
    // Default arc status
    parsed.arcStatus = 'introduced';
    
    return Object.keys(parsed).length > 0 ? parsed : null;
  } catch (error) {
    console.error('[parseCharacterProfile] Error parsing:', error);
    return null;
  }
}

/**
 * Parse location details from AI response
 */
export function parseLocationProfile(aiResponse: string): Partial<ParsedLocation> | null {
  try {
    const parsed: Partial<ParsedLocation> = {};
    
    // Extract name and type (INT/EXT)
    const nameMatch = aiResponse.match(/(?:INT\.|EXT\.|INT\/EXT\.?)\s+([A-Z\s]+)/i);
    if (nameMatch) {
      parsed.name = nameMatch[1].trim();
      if (/INT\s*\/\s*EXT/i.test(aiResponse)) {
        parsed.type = 'INT/EXT';
      } else if (/INT/i.test(aiResponse)) {
        parsed.type = 'INT';
      } else if (/EXT/i.test(aiResponse)) {
        parsed.type = 'EXT';
      }
    } else {
      // Fallback: look for location name
      const locationMatch = aiResponse.match(/(?:Location|Name)[\s:]*([A-Z][a-zA-Z\s]+)/);
      if (locationMatch) {
        parsed.name = locationMatch[1].trim();
      }
    }
    
    // Determine INT/EXT if not already set
    if (!parsed.type) {
      if (/interior|inside|indoor/i.test(aiResponse)) {
        parsed.type = 'INT';
      } else if (/exterior|outside|outdoor/i.test(aiResponse)) {
        parsed.type = 'EXT';
      } else {
        parsed.type = 'INT'; // Default
      }
    }
    
    // Extract visual description (The Look section)
    const lookMatch = aiResponse.match(/(?:The Look|Visual Description|Description)[\s:]*\n([^\n]+(?:\n[^\n#*]+)*)/i);
    if (lookMatch && lookMatch[1]) {
      parsed.description = lookMatch[1].trim();
    } else {
      // Fallback: first substantial paragraph
      const paragraphs = aiResponse.split('\n\n').filter(p => p.trim().length > 50);
      if (paragraphs.length > 0) {
        parsed.description = paragraphs[0].trim();
      }
    }
    
    // Extract atmosphere (The Feel section)
    const atmosphereMatch = aiResponse.match(/(?:The Feel|Atmosphere|Mood)[\s:]*\n([^\n]+(?:\n[^\n#*]+)*)/i);
    if (atmosphereMatch && atmosphereMatch[1]) {
      parsed.atmosphereNotes = atmosphereMatch[1].trim();
    }
    
    // Extract production notes
    const productionMatch = aiResponse.match(/(?:Production Notes|Practical Considerations|Set Requirements)[\s:]*\n([^\n]+(?:\n[^\n#*]+)*)/i);
    if (productionMatch && productionMatch[1]) {
      parsed.productionNotes = productionMatch[1].trim();
    }
    
    // Extract action potential or set requirements
    const actionMatch = aiResponse.match(/(?:Action Potential|Set Requirements)[\s:]*\n([^\n]+(?:\n[^\n#*]+)*)/i);
    if (actionMatch && actionMatch[1]) {
      parsed.setRequirements = actionMatch[1].trim();
    }
    
    return Object.keys(parsed).length > 0 ? parsed : null;
  } catch (error) {
    console.error('[parseLocationProfile] Error parsing:', error);
    return null;
  }
}

/**
 * Parse scene/story beat from AI response
 */
export function parseSceneProfile(aiResponse: string): Partial<ParsedScene> | null {
  try {
    const parsed: Partial<ParsedScene> = {};
    
    // Extract scene heading
    const headingMatch = aiResponse.match(/(?:INT\.|EXT\.|INT\/EXT\.)\s+[A-Z\s]+-\s+(?:DAY|NIGHT|DUSK|DAWN|MORNING|AFTERNOON|EVENING|CONTINUOUS)/i);
    if (headingMatch) {
      parsed.heading = headingMatch[0].trim().toUpperCase();
    } else {
      // Fallback: look for heading in text
      const headingLineMatch = aiResponse.match(/(?:Scene Heading|Heading)[\s:]*\n?([^\n]+)/i);
      if (headingLineMatch && headingLineMatch[1]) {
        parsed.heading = headingLineMatch[1].trim().toUpperCase();
      }
    }
    
    // Extract synopsis (Scene Description section)
    const synopsisMatch = aiResponse.match(/(?:Scene Description|Synopsis|What Happens)[\s:]*\n([^\n]+(?:\n[^\n#*]+)*)/i);
    if (synopsisMatch && synopsisMatch[1]) {
      parsed.synopsis = synopsisMatch[1].trim();
    } else {
      // Fallback: first substantial paragraph after heading
      const afterHeading = aiResponse.split(parsed.heading || '')[1] || aiResponse;
      const paragraphs = afterHeading.split('\n\n').filter(p => p.trim().length > 50);
      if (paragraphs.length > 0) {
        parsed.synopsis = paragraphs[0].trim();
      }
    }
    
    // Default values
    parsed.number = 1;
    parsed.status = 'draft';
    
    return Object.keys(parsed).length > 0 ? parsed : null;
  } catch (error) {
    console.error('[parseSceneProfile] Error parsing:', error);
    return null;
  }
}

/**
 * Generic parser that detects entity type and calls appropriate parser
 */
export function parseAIResponse(aiResponse: string, entityType: 'character' | 'location' | 'scene'): any | null {
  switch (entityType) {
    case 'character':
      return parseCharacterProfile(aiResponse);
    case 'location':
      return parseLocationProfile(aiResponse);
    case 'scene':
      return parseSceneProfile(aiResponse);
    default:
      return null;
  }
}

