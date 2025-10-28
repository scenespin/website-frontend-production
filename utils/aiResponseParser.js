/**
 * AI Response Parser
 * 
 * Parses AI-generated responses from workflow interviews to extract
 * structured data that can auto-fill forms.
 */

/**
 * Parse character profile from AI response
 */
export function parseCharacterProfile(aiResponse) {
  try {
    const parsed = {
      name: '',
      age: '',
      role: '',
      physicalDescription: '',
      personality: '',
      background: '',
      goals: '',
      flaws: '',
      relationships: '',
      fullProfile: aiResponse
    };
    
    // Extract name and age (usually in first line or CAPS)
    const nameMatch = aiResponse.match(/([A-Z][A-Z\s]+)\s*\(([^)]+)\)/);
    if (nameMatch) {
      parsed.name = nameMatch[1].trim();
      parsed.age = nameMatch[2].trim();
    }
    
    // Extract physical description (usually first paragraph after name)
    const physicalMatch = aiResponse.match(/\*\*Physical Introduction\*\*[:\s]*(.+?)(?:\*\*|$)/s);
    if (physicalMatch) {
      parsed.physicalDescription = physicalMatch[1].trim();
    }
    
    // Extract personality
    const personalityMatch = aiResponse.match(/\*\*Personality Essence\*\*[:\s]*(.+?)(?:\*\*|$)/s);
    if (personalityMatch) {
      parsed.personality = personalityMatch[1].trim();
    }
    
    // Extract background
    const backgroundMatch = aiResponse.match(/\*\*Background[^*]*\*\*[:\s]*(.+?)(?:\*\*|$)/s);
    if (backgroundMatch) {
      parsed.background = backgroundMatch[1].trim();
    }
    
    // Extract goals
    const goalsMatch = aiResponse.match(/\*\*Character Arc Potential\*\*[:\s]*(.+?)(?:\*\*|$)/s);
    if (goalsMatch) {
      parsed.goals = goalsMatch[1].trim();
    }
    
    // Extract relationships
    const relationshipsMatch = aiResponse.match(/\*\*Relationships[^*]*\*\*[:\s]*(.+?)(?:\*\*|$)/s);
    if (relationshipsMatch) {
      parsed.relationships = relationshipsMatch[1].trim();
    }
    
    return parsed;
  } catch (error) {
    console.error('Error parsing character profile:', error);
    return { fullProfile: aiResponse };
  }
}

/**
 * Parse location details from AI response
 */
export function parseLocationDetails(aiResponse) {
  try {
    const parsed = {
      name: '',
      type: '', // INT or EXT
      visualDescription: '',
      atmosphere: '',
      actionPotential: '',
      productionNotes: '',
      dramaticPurpose: '',
      fullDescription: aiResponse
    };
    
    // Extract location name and type
    const nameMatch = aiResponse.match(/(INT\.|EXT\.)\s*([A-Z\s]+)/);
    if (nameMatch) {
      parsed.type = nameMatch[1];
      parsed.name = nameMatch[2].trim();
    }
    
    // Extract visual description
    const lookMatch = aiResponse.match(/\*\*The Look\*\*[:\s]*(.+?)(?:\*\*|$)/s);
    if (lookMatch) {
      parsed.visualDescription = lookMatch[1].trim();
    }
    
    // Extract atmosphere
    const feelMatch = aiResponse.match(/\*\*The Feel\*\*[:\s]*(.+?)(?:\*\*|$)/s);
    if (feelMatch) {
      parsed.atmosphere = feelMatch[1].trim();
    }
    
    // Extract action potential
    const actionMatch = aiResponse.match(/\*\*Action Potential\*\*[:\s]*(.+?)(?:\*\*|$)/s);
    if (actionMatch) {
      parsed.actionPotential = actionMatch[1].trim();
    }
    
    // Extract production notes
    const productionMatch = aiResponse.match(/\*\*Production Notes\*\*[:\s]*(.+?)(?:\*\*|$)/s);
    if (productionMatch) {
      parsed.productionNotes = productionMatch[1].trim();
    }
    
    // Extract dramatic purpose
    const purposeMatch = aiResponse.match(/\*\*Dramatic Purpose\*\*[:\s]*(.+?)(?:\*\*|$)/s);
    if (purposeMatch) {
      parsed.dramaticPurpose = purposeMatch[1].trim();
    }
    
    return parsed;
  } catch (error) {
    console.error('Error parsing location details:', error);
    return { fullDescription: aiResponse };
  }
}

/**
 * Parse scene breakdown from AI response
 */
export function parseSceneBreakdown(aiResponse) {
  try {
    const parsed = {
      heading: '',
      act: '',
      importance: '',
      sceneDescription: '',
      conflict: '',
      emotionalArc: '',
      plotAdvancement: '',
      dialogue: '',
      visualNotes: '',
      fullBreakdown: aiResponse
    };
    
    // Extract scene heading
    const headingMatch = aiResponse.match(/(INT\.|EXT\.)[^\n]+/);
    if (headingMatch) {
      parsed.heading = headingMatch[0].trim();
    }
    
    // Extract act
    const actMatch = aiResponse.match(/Act\s*(\d+)/i);
    if (actMatch) {
      parsed.act = actMatch[1];
    }
    
    // Extract scene description
    const descriptionMatch = aiResponse.match(/\*\*Scene Description\*\*[:\s]*(.+?)(?:\*\*|$)/s);
    if (descriptionMatch) {
      parsed.sceneDescription = descriptionMatch[1].trim();
    }
    
    // Extract conflict
    const conflictMatch = aiResponse.match(/\*\*Character Dynamics[^*]*\*\*[:\s]*(.+?)(?:\*\*|$)/s);
    if (conflictMatch) {
      parsed.conflict = conflictMatch[1].trim();
    }
    
    // Extract emotional arc
    const emotionalMatch = aiResponse.match(/\*\*Emotional Arc[^*]*\*\*[:\s]*(.+?)(?:\*\*|$)/s);
    if (emotionalMatch) {
      parsed.emotionalArc = emotionalMatch[1].trim();
    }
    
    // Extract plot advancement
    const plotMatch = aiResponse.match(/\*\*Plot Advancement\*\*[:\s]*(.+?)(?:\*\*|$)/s);
    if (plotMatch) {
      parsed.plotAdvancement = plotMatch[1].trim();
    }
    
    // Extract dialogue
    const dialogueMatch = aiResponse.match(/\*\*Dialogue\*\*[:\s]*(.+?)(?:\*\*|$)/s);
    if (dialogueMatch) {
      parsed.dialogue = dialogueMatch[1].trim();
    }
    
    // Extract visual notes
    const visualMatch = aiResponse.match(/\*\*Visual[^*]*\*\*[:\s]*(.+?)(?:\*\*|$)/s);
    if (visualMatch) {
      parsed.visualNotes = visualMatch[1].trim();
    }
    
    return parsed;
  } catch (error) {
    console.error('Error parsing scene breakdown:', error);
    return { fullBreakdown: aiResponse };
  }
}

/**
 * Main parser that routes to specific parsers based on type
 */
export function parseAIResponse(aiResponse, type) {
  switch (type) {
    case 'character':
      return parseCharacterProfile(aiResponse);
    case 'location':
      return parseLocationDetails(aiResponse);
    case 'scene':
      return parseSceneBreakdown(aiResponse);
    default:
      return { raw: aiResponse };
  }
}

