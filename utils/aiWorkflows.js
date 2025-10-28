/**
 * AI Interview Workflows for Character, Location, and Scene Creation
 * 
 * These workflows guide users through conversational interviews to create
 * fully-formed character profiles, location details, and scene breakdowns.
 */

// ============================================================================
// CHARACTER CREATION WORKFLOW
// ============================================================================

export const characterWorkflow = {
  systemPrompt: `I'm helping the user create a new character for their screenplay through a conversational interview.

Ask questions one at a time. After all answers, generate a comprehensive character profile including:

**Physical Introduction** (screenplay format, 2-3 sentences)
- Age, appearance, memorable visual detail
- Active voice, what the camera sees
- Example: "SARAH (30s) moves with the precision of a surgeon and the wariness of a survivor. A faded scar traces her left cheek."

**Personality Essence** (1-2 key behavioral traits shown through behavior)
**Background/Context** (2-3 sentences, story-relevant only)
**Character Arc Potential** (start vs. end, internal conflict, external goals)
**Relationships & Dynamics** (key relationships that define or challenge them)

WRITING STYLE:
✓ Active voice only
✓ Focus on what the CAMERA CAN SEE
✓ Avoid internal thoughts
✓ Make initial description 3-4 sentences max
✓ Screenplay-format appropriate`,
  
  questions: [
    {
      question: "What's your character's name and rough age?",
      placeholder: "e.g., Sarah, mid-30s"
    },
    {
      question: "What role do they play in the story - protagonist, antagonist, or supporting character?",
      placeholder: "e.g., Protagonist - the detective solving the case"
    },
    {
      question: "Can you describe their physical appearance in 2-3 sentences? What's one memorable detail about them?",
      placeholder: "e.g., Tall, wears a faded leather jacket, has a scar on her cheek"
    },
    {
      question: "What's their core personality trait or behavioral pattern? Show me through action, not adjectives.",
      placeholder: "e.g., Always checks exits when entering a room"
    },
    {
      question: "What do they want? What's driving them?",
      placeholder: "e.g., To find her missing sister and bring her home"
    },
    {
      question: "What's their biggest flaw or internal conflict?",
      placeholder: "e.g., Trusts no one, pushes people away"
    },
    {
      question: "Is there any background that's crucial to their story?",
      placeholder: "e.g., Former FBI agent, left after a case went wrong"
    },
    {
      question: "How do they interact with other characters? Any key relationships?",
      placeholder: "e.g., Protective of her partner, distant with family"
    }
  ]
};

// ============================================================================
// LOCATION CREATION WORKFLOW
// ============================================================================

export const locationWorkflow = {
  systemPrompt: `I'm helping the user create a new location for their screenplay through a conversational interview.

Ask questions one at a time. After all answers, generate comprehensive location details:

**The Look** (Visual Description - straightforward, vivid, active voice)
**The Feel** (Atmosphere, mood, time of day, lighting, sound)
**Action Potential** (What characters can DO here, how environment affects action)
**Production Notes** (Set requirements, lighting, sound, filming logistics)
**Dramatic Purpose** (Why THIS location? How it serves the story)

SCREENPLAY WRITING RULES:
✓ Use ACTIVE voice always
✓ Be concise (few sentences, not paragraphs)
✓ "Show, don't tell" through action and environment
✓ Scene description = Look + Feel + Action
✓ Don't over-describe - scripts aren't books`,
  
  questions: [
    {
      question: "What's the name of this location? Is it interior (INT) or exterior (EXT)?",
      placeholder: "e.g., INT. ABANDONED WAREHOUSE or EXT. CITY ROOFTOP"
    },
    {
      question: "Can you describe what this place looks like? Paint me a visual picture in 2-3 sentences.",
      placeholder: "e.g., Concrete floors, broken windows, rusted machinery"
    },
    {
      question: "What's the atmosphere or mood of this space? How should it feel?",
      placeholder: "e.g., Tense, claustrophobic, dangerous"
    },
    {
      question: "What can characters DO in this location? Any unique features or obstacles?",
      placeholder: "e.g., Hide behind machinery, climb to upper catwalks"
    },
    {
      question: "What time of day is typical for scenes here? How's the lighting?",
      placeholder: "e.g., Night, dim light from street lamps through windows"
    },
    {
      question: "Are there any important sounds or ambient noise?",
      placeholder: "e.g., Dripping water, distant traffic, metal creaking"
    },
    {
      question: "Why is THIS location important to your story? What purpose does it serve?",
      placeholder: "e.g., Final confrontation location, isolated from help"
    },
    {
      question: "Any production notes - set requirements, practical considerations?",
      placeholder: "e.g., Needs practical fire effects, sound reverb"
    }
  ]
};

// ============================================================================
// SCENE CREATION WORKFLOW
// ============================================================================

export const sceneWorkflow = {
  systemPrompt: `I'm helping the user create a new scene/story beat for their screenplay through a conversational interview.

Ask questions one at a time. After all answers, generate a comprehensive scene breakdown:

**Scene Description** (2-4 sentences in ACTIVE VOICE showing what the CAMERA SEES)
**The Look + The Feel + The Action** (Visual, atmosphere, character actions)
**Character Dynamics & Conflict** (Who wants what? What's preventing them? Interactions)
**Emotional Arc & Beats** (Where they start → what changes → where they end)
**Plot Advancement** (New info revealed, how scene moves story forward, setup/payoff)
**Dialogue** (Subtext is king, avoid "on the nose" dialogue, each character speaks differently)
**Visual & Production Notes** (Camera, lighting, sound, props)

SCREENPLAY FORMATTING RULES:
✓ Active voice ALWAYS ("Sarah runs" not "Sarah is running")
✓ Present tense ALWAYS
✓ Show through action, not narration
✓ Character names in CAPS on first appearance
✓ Sound effects in CAPS
✓ White space is your friend - easy to read
✓ One scene = One dramatic unit`,
  
  questions: [
    {
      question: "What's the scene heading? (Example: INT. COFFEE SHOP - DAY or EXT. CITY STREET - NIGHT)",
      placeholder: "e.g., INT. POLICE STATION - NIGHT"
    },
    {
      question: "Which act is this scene in? (Act 1, 2, or 3)",
      placeholder: "e.g., Act 2"
    },
    {
      question: "How important is this scene? (Major plot point, minor scene, or turning point)",
      placeholder: "e.g., Major plot point - discovery of key evidence"
    },
    {
      question: "What HAPPENS in this scene? Give me the basic action in 2-3 sentences.",
      placeholder: "e.g., Sarah discovers a photo that links her sister to the case"
    },
    {
      question: "Who's in the scene? What do they want?",
      placeholder: "e.g., Sarah wants answers, the captain wants her off the case"
    },
    {
      question: "What's the main conflict or tension? What's preventing them from getting what they want?",
      placeholder: "e.g., The captain threatens to fire her if she continues"
    },
    {
      question: "What emotion should the audience feel? How does the character's emotion change from start to end?",
      placeholder: "e.g., Starts hopeful, ends desperate and determined"
    },
    {
      question: "Does this scene reveal anything new? How does it move the plot forward?",
      placeholder: "e.g., Reveals her sister was investigating the same case"
    },
    {
      question: "Any specific dialogue moments you're imagining?",
      placeholder: "e.g., 'I'm not asking for permission anymore'"
    },
    {
      question: "Is there any twist, reveal, or surprise element?",
      placeholder: "e.g., The captain recognizes the person in the photo"
    }
  ]
};

// ============================================================================
// WORKFLOW GETTER
// ============================================================================

export function getWorkflow(type) {
  switch (type) {
    case 'character':
      return characterWorkflow;
    case 'location':
      return locationWorkflow;
    case 'scene':
      return sceneWorkflow;
    default:
      throw new Error(`Unknown workflow type: ${type}`);
  }
}

