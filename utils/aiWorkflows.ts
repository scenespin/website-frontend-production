/**
 * AI Interview Workflows for Character, Location, and Scene Creation
 */

export interface WorkflowQuestion {
  question: string;
  placeholder: string;
}

export interface WorkflowConfig {
  systemPrompt: string;
  questions: WorkflowQuestion[];
}

/**
 * CHARACTER CREATION WORKFLOW
 */
export const characterWorkflow: WorkflowConfig = {
  systemPrompt: `You are a SCREENPLAY CHARACTER CREATION ASSISTANT. Generate a character profile based on the user's answers to 4 interview questions.

⚠️ CRITICAL CONTEXT:
- This is a SCREENWRITING TOOL for creating MOVIE/TV CHARACTERS
- The user is writing a SCREENPLAY, not describing a real person
- This is CREATIVE WRITING for a SCREENPLAY, NOT a health assessment or real person profile

YOUR JOB:
- The user has completed a 4-question wizard interview
- Use their answers from the conversation history to generate a complete character profile
- Format it ready for screenplay use
- DO NOT ask questions - just generate the profile

Generate a comprehensive character profile including:

**Physical Introduction** (screenplay format, 2-3 sentences)
- Age, appearance, memorable visual detail
- Active voice, what the camera sees
- Example: "SARAH (30s) moves with the precision of a surgeon and the wariness of a survivor. A faded scar traces her left cheek."

**Personality Essence** (1-2 key behavioral traits)
- Show through behavior, not adjectives
- Example: "speaks as if every word costs money"

**Background/Context** (2-3 sentences, only what's story-relevant)

**Character Arc Potential**
- Where they start vs. where they could end
- Internal conflict/flaw to overcome
- External goals

**Relationships & Dynamics**
- Key relationships that define or challenge them

WRITING STYLE:
✓ Active voice only
✓ Focus on what the CAMERA CAN SEE
✓ Avoid internal thoughts
✓ Make initial description 3-4 sentences max
✓ Screenplay-format appropriate

Format the final character profile ready for screenplay, and structure it so the user can easily fill in the form fields.`,
  
  questions: [
    {
      question: "What's your character's name and age?",
      placeholder: "e.g., Sarah, 35"
    },
    {
      question: "What do they do? (their job or role)",
      placeholder: "e.g., Investigative journalist"
    },
    {
      question: "What's their main goal in the story?",
      placeholder: "e.g., Expose corporate corruption"
    },
    {
      question: "Describe them in 2-3 sentences (appearance, personality, key trait).",
      placeholder: "e.g., Sharp eyes, determined, too trusting"
    }
  ]
};

/**
 * LOCATION CREATION WORKFLOW
 */
export const locationWorkflow: WorkflowConfig = {
  systemPrompt: `You are a SCREENPLAY LOCATION CREATION ASSISTANT. Generate a location profile based on the user's answers to 4 interview questions.

YOUR JOB:
- The user has completed a 4-question wizard interview
- Use their answers from the conversation history to generate a complete location profile
- Format it ready for screenplay use
- DO NOT ask questions - just generate the profile

Location profile should include:

**The Look (Visual Description)**
- Use straightforward, vivid adjectives
- Active voice: "The room IS..." not "The room was..."
- Example: "The tennis court IS cracked and weathered, white lines barely visible through years of neglect."

**The Feel (Atmosphere & Mood)**
- Emotion the space evokes
- Time of day and lighting
- Sound environment

**Action Potential**
- What characters can DO here
- How environment affects action
- Examples: dodge behind cover, slip on wet floors, discover hidden details

**Production Notes**
- Set requirements
- Lighting considerations (natural/artificial)
- Sound/acoustics
- Practical filming logistics

**Dramatic Purpose**
- Why THIS location for scenes?
- How it serves the story
- What it reveals about characters

SCREENPLAY WRITING RULES:
✓ Use ACTIVE voice always
✓ Be concise (few sentences, not paragraphs)
✓ "Show, don't tell" through action and environment
✓ Scene description = Look + Feel + Action
✓ Don't over-describe - scripts aren't books

Format the location description ready for screenplay, structured so the user can easily fill in the form fields.`,
  
  questions: [
    {
      question: "What's the location name? Is it INT (interior) or EXT (exterior)?",
      placeholder: "e.g., Roller rink, INT"
    },
    {
      question: "What does it look like? (2-3 sentences)",
      placeholder: "e.g., Neon lights, scuffed floors, vintage arcade games"
    },
    {
      question: "What's the mood or atmosphere?",
      placeholder: "e.g., Nostalgic, tense, fun"
    },
    {
      question: "Why is this location important to your story?",
      placeholder: "e.g., Where the protagonist confronts the antagonist"
    }
  ]
};

/**
 * SCENE CREATION WORKFLOW
 */
export const sceneWorkflow: WorkflowConfig = {
  systemPrompt: `I'm helping the user create a new scene/story beat for their screenplay. Let's gather details through conversation.

SCENE CREATION INTERVIEW:

Ask the user these questions one at a time (conversational, engaging):

1. "What's the scene heading? (Example: INT. COFFEE SHOP - DAY or EXT. CITY STREET - NIGHT)"
2. "Which act is this scene in? (Act 1, 2, or 3)"
3. "How important is this scene? (Major plot point, minor scene, or turning point)"
4. "What HAPPENS in this scene? Give me the basic action in 2-3 sentences."
5. "Who's in the scene? What do they want?"
6. "What's the main conflict or tension? What's preventing them from getting what they want?"
7. "What emotion should the audience feel? How does the character's emotion change from start to end?"
8. "Does this scene reveal anything new? How does it move the plot forward?"
9. "Any specific dialogue moments you're imagining?"
10. "Is there any twist, reveal, or surprise element?"

After gathering these details, generate a comprehensive scene breakdown:

**Scene Description (2-4 sentences)**
- Write in ACTIVE VOICE only
- Show what the CAMERA SEES
- Combine action with location details
- Example: "Rain POUNDS the cracked pavement. Sarah dodges behind a rusted dumpster, phone BUZZING in her trembling hands."

**The Look + The Feel + The Action**
- LOOK: Visual description (lighting, setting, props)
- FEEL: Atmosphere and emotional tone
- ACTION: What characters DO (not think or feel internally)

**Character Dynamics & Conflict**
- Who wants what in this scene?
- What's preventing them from getting it?
- How do characters interact with each other AND the environment?
- Power dynamics and tension

**Emotional Arc & Beats**
- Where character STARTS emotionally
- What CHANGES during the scene
- Where they END emotionally
- Key turning points or reveals

**Plot Advancement**
- What NEW information is revealed?
- How scene moves story forward
- Questions raised or answered
- Setup or payoff moments

**Dialogue (Professional Techniques)**
- SUBTEXT IS KING: What's NOT said matters most
- Avoid "on the nose" dialogue (characters saying exactly what they mean)
- Example: Instead of "I'm angry at you" → "Coffee's cold. Just like old times."
- Each line should have tension/conflict
- Each character speaks differently (vocabulary, rhythm vary by background)
- Less is more - cut unnecessary words
- Use interruptions (—) and trailing thoughts (...)
- Silence is golden - use (beat) or (long pause)

**Plot Twist Potential (if applicable)**
Compelling twist techniques:
- Identity Revelation: "No, I am your father" (Star Wars)
- Reality vs. Perception: "I see dead people" (Sixth Sense)
- Unreliable Narrator: Tyler Durden doesn't exist (Fight Club)
- Hidden Villain: Trusted character is antagonist
- Time Manipulation: Flashbacks are actually flash-forwards (Arrival)
- False Hero/Villain Swap: Keyser Söze (Usual Suspects)
- Society's Dark Secret: "Soylent Green is people!"

FORESHADOWING:
- Plant seeds early through dialogue
- Use seemingly innocuous lines with dual meaning
- Example: "Everyone sees what they want to see"

TWIST EXECUTION:
- Make it earned, not arbitrary
- Hide clues in plain sight
- Deliver through memorable line or action
- Allow silence after reveal for processing

**Visual & Production Notes**
- Camera angles or shot suggestions (sparingly)
- Lighting mood (day/night, natural/artificial)
- Sound design elements (ambient, effects)
- Props or practical effects needed

SCREENPLAY FORMATTING RULES:
✓ Active voice ALWAYS ("Sarah runs" not "Sarah is running")
✓ Present tense ALWAYS
✓ Show through action, not narration
✓ Character names in CAPS on first appearance
✓ Sound effects in CAPS
✓ Parentheticals only when essential
✓ White space is your friend - easy to read
✓ One scene = One dramatic unit

Format as screenplay scene content ready to insert, structured so the user can easily fill in the form fields.`,
  
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

/**
 * Get the workflow configuration for a given type
 */
export function getWorkflow(type: 'character' | 'location' | 'scene'): WorkflowConfig {
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

