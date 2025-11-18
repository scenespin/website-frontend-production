/**
 * Prompt Builders for AI Agents
 * 
 * Restored from old template to preserve algorithmic ideas:
 * - Content vs Advice distinction for Screenwriter
 * - Full scene generation for Director (5-15+ lines)
 * - Comprehensive rewrite prompts with surrounding text
 */

/**
 * Build context information string for AI prompts
 * @param {Object} sceneContext - Scene context from detectCurrentScene
 * @returns {string} Formatted context string
 */
export function buildContextInfo(sceneContext) {
  if (!sceneContext) return '';
  
  let contextInfo = '';
  
  if (sceneContext.heading) {
    contextInfo += `SCREENPLAY CONTEXT:\nCurrent scene: ${sceneContext.heading}\n`;
  }
  if (sceneContext.act) {
    contextInfo += `Act: ${sceneContext.act}\n`;
  }
  if (sceneContext.characters && sceneContext.characters.length > 0) {
    contextInfo += `Characters in this scene: ${sceneContext.characters.join(', ')}\n`;
  }
  
  if (contextInfo) {
    contextInfo += '\n';
  }
  
  return contextInfo;
}

/**
 * Detect if user wants screenplay content vs advice/discussion
 * @param {string} message - User's message
 * @returns {boolean} True if content generation, false if advice
 */
export function detectContentRequest(message) {
  const hasActionVerb = /explodes|enters|leaves|says|does|runs|walks|sees|hears|finds|comes|goes|arrives|exits|sits|stands|turns|looks|grabs|takes|opens|closes|attacks|fights|dies|falls|jumps|screams|whispers|shouts|morphs|transforms|becomes|changes|appears|disappears|moves|flies|crashes|breaks|shatters/i.test(message);
  const hasContentKeyword = /write|add|create|generate|show|give me|what happens|continue|next|scene where|moment where|then|suddenly|meanwhile/i.test(message);
  const isShortStatement = message.split(' ').length <= 10 && !message.includes('?');
  const isNarrativeDescription = /^(her|his|the|a|an)\s+(monitor|tv|phone|door|window|car|computer|screen|robot|desk|wall|floor|ceiling|room)/i.test(message);
  
  // 🔥 NEW: Detect rewrite/feedback requests (should be treated as content generation)
  const isRewriteRequest = /(its|it's|this is|that's|this feels|too|not|needs|should|could|make it|fix|change|revise|rewrite|redo|better|different|gooey|melodramatic|convenient|predictable|on-the-nose|telling|showing)/i.test(message);
  
  const isContentRequest = hasActionVerb || hasContentKeyword || isRewriteRequest || (
    isShortStatement && 
    !message.toLowerCase().startsWith('how') && 
    !message.toLowerCase().startsWith('what') && 
    !message.toLowerCase().startsWith('why') && 
    !message.toLowerCase().startsWith('when') && 
    !message.toLowerCase().startsWith('where')
  );
  
  return isContentRequest || isNarrativeDescription;
}

/**
 * Build chat content generation prompt (for generating screenplay content)
 * @param {string} message - User's message
 * @param {Object} sceneContext - Scene context from detectCurrentScene
 * @returns {string} Formatted prompt for content generation
 */
export function buildChatContentPrompt(message, sceneContext) {
  const contextInfo = buildContextInfo(sceneContext);
  
  // 🔥 NEW: Detect if this is a rewrite/feedback request
  const isRewriteRequest = /(its|it's|this is|that's|this feels|too|not|needs|should|could|make it|fix|change|revise|rewrite|redo|better|different|gooey|melodramatic|convenient|predictable|on-the-nose|telling|showing)/i.test(message);
  
  if (isRewriteRequest) {
    // This is a rewrite/feedback request - provide revised screenplay content
    return `${contextInfo}User's feedback: "${message}"

REWRITE REQUEST - PROVIDE REVISED SCREENPLAY CONTENT:

The user is giving feedback about the current scene/content. They want you to revise it based on their feedback.

CRITICAL INSTRUCTIONS:
1. Provide ONLY revised screenplay content in Fountain format
2. NO explanations, NO meta-commentary, NO questions
3. Character names in ALL CAPS (NOT bold/markdown)
4. Parentheticals in parentheses (NOT italics/markdown)
5. Dialogue in plain text below character name
6. Action lines in normal case
7. NO markdown formatting (no **, no *, no ---)
8. Current scene: ${sceneContext?.heading || 'INT. LOCATION - DAY'}
9. Use the scene context to provide a revised version that addresses their feedback

OUTPUT: Revised screenplay content that fixes the issues mentioned.`;
  }
  
  return `${contextInfo}User's request: "${message}"

YOU ARE A SCREENPLAY WRITER - NOT A GRAMMAR CORRECTOR.

Write 1-3 vivid screenplay elements in Fountain format.

ACTION EXAMPLE:
Input: "Sarah's monitor comes to life as a robot"
Output: "Sarah's monitor FLICKERS violently. The screen BULGES outward, pixels reorganizing into metallic plates. A sleek ROBOT unfolds from the chassis."

DIALOGUE EXAMPLE:
Input: "Sarah says what the hell"
Output:
SARAH
What the hell?

MIXED EXAMPLE:
Input: "The robot speaks to Sarah"
Output:
The ROBOT's optical sensors focus on Sarah.

ROBOT
(synthetic)
Sarah Chen. I have a message for you.

CRITICAL INSTRUCTIONS:
1. Be DESCRIPTIVE and VISUAL for action
2. Include dialogue ONLY if user mentions speaking/talking/saying
3. Character names in ALL CAPS when they speak (NOT bold/markdown like **SARAH** - just SARAH)
4. Parentheticals in parentheses (NOT italics/markdown)
5. NO markdown formatting (no **, no *, no ---, no markdown of any kind)
6. Use active verbs and cinematic language
7. Current scene: ${sceneContext?.heading || 'INT. LOCATION - DAY'}
8. NO scene headings
9. Each request is standalone
10. OUTPUT ONLY screenplay content - NO explanations, NO questions, NO writing notes, NO meta-commentary, NO suggestions, NO alternatives
11. Do NOT add sections like "WRITING NOTE" or "---" or "ALTERNATIVE OPTIONS" - output ONLY the screenplay content
12. Do NOT ask questions or provide multiple options - just write the screenplay content
13. Start directly with the screenplay content - no intro text, no "Here's..." or "I'll write..."

OUTPUT FORMAT: Pure Fountain screenplay text only. Nothing else.

Now write for: "${message}"`;
}

/**
 * Build chat advice prompt (for advice/discussion)
 * @param {string} message - User's message
 * @param {Object} sceneContext - Scene context from detectCurrentScene
 * @returns {string} Formatted prompt for advice
 */
export function buildChatAdvicePrompt(message, sceneContext) {
  const contextInfo = buildContextInfo(sceneContext);
  
  return `${contextInfo}${message}

Note: The user is asking for advice or discussion. Keep your response concise and focused on their specific question. Reference the scene context only when directly relevant. Provide practical, actionable advice without over-explaining or adding unnecessary details.`;
}

/**
 * Build director mode prompt (expansive scene generation - supports multiple lengths)
 * @param {string} message - User's message
 * @param {Object} sceneContext - Scene context from detectCurrentScene
 * @param {string} generationLength - 'short' (5-10 lines), 'full' (15-30 lines), 'multiple' (2-3 scenes)
 * @returns {string} Formatted prompt for Director mode
 */
export function buildDirectorPrompt(message, sceneContext, generationLength = 'full') {
  const contextInfo = buildContextInfo(sceneContext);
  
  // Define length requirements based on generationLength
  let lengthInstruction = '';
  let sceneCountInstruction = '';
  
  switch (generationLength) {
    case 'short':
      lengthInstruction = '5-10 lines of screenplay';
      sceneCountInstruction = 'ONE scene only';
      break;
    case 'full':
      lengthInstruction = '15-30 lines of screenplay (a complete, full scene)';
      sceneCountInstruction = 'ONE complete scene';
      break;
    case 'multiple':
      lengthInstruction = '2-3 complete scenes (each 15-30 lines)';
      sceneCountInstruction = 'MULTIPLE scenes (2-3 scenes) with proper scene headings';
      break;
    default:
      lengthInstruction = '15-30 lines of screenplay';
      sceneCountInstruction = 'ONE complete scene';
  }
  
  return `${contextInfo}User's request: "${message}"

DIRECTOR MODE - SCENE DEVELOPMENT:

You are a professional screenplay director helping develop full scenes. Your role is to:

1. EXPAND THE IDEA: Take the user's concept and develop it into complete scene content
2. SCENE LENGTH: Write ${lengthInstruction}
3. SCENE COUNT: Generate ${sceneCountInstruction}
   ${generationLength === 'multiple' ? '   - Each scene must have its own scene heading (INT./EXT. LOCATION - TIME)\n   - Connect scenes narratively if appropriate\n   - Each scene should be complete and standalone' : ''}
4. INCLUDE ELEMENTS:
   - Action lines that set the mood and visual
   - Character reactions and emotions
   - Dialogue when appropriate to the moment
   - Parentheticals for tone/delivery
   - Scene atmosphere and tension
   - Visual storytelling and cinematic direction

5. CREATIVE DEVELOPMENT:
   - If user says "Sarah's monitor becomes a robot" → Show the transformation, Sarah's reaction, maybe the robot speaks
   - If user says "Two characters argue" → Write the full argument with back-and-forth dialogue
   - If user says "Generate a scene where..." → Write the complete scene(s)
   - Add emotional beats and character dynamics
   - Build tension and conflict naturally
   - Show, don't tell - use visual action

6. CONTEXT AWARENESS:
   - Current scene: ${sceneContext?.heading || 'current scene'}
   - Characters available: ${sceneContext?.characters?.join(', ') || 'introduce new ones if needed'}
   ${generationLength === 'multiple' ? '   - You MAY add new scene headings to create multiple scenes' : '   - Do NOT add scene headings unless explicitly changing location'}

7. FOUNTAIN FORMAT (CRITICAL - NO MARKDOWN):
   - Character names in ALL CAPS (NOT bold/markdown)
   - Example: SARAH (NOT **SARAH** or *SARAH*)
   - Parentheticals in parentheses: (examining the USB drive) (NOT italics/markdown)
   - Dialogue in plain text below character name
   - Action lines in normal case
   - NO markdown formatting (no **, no *, no ---, no markdown of any kind)
   - Proper spacing between elements
   - Scene headings in ALL CAPS: INT. LOCATION - TIME
   - Example format:
     SARAH
     (examining the USB drive)
     What does that mean?

8. THOROUGHNESS: Be comprehensive and detailed. This is the Director agent - generate MORE content, not less. Fill out scenes with rich detail, multiple beats, and complete moments.

9. OUTPUT ONLY: Provide ONLY the screenplay content. Do NOT add explanations, questions, or meta-commentary at the end.

Output: ${generationLength === 'multiple' ? 'Multiple complete, cinematic scenes' : 'A complete, cinematic scene'} in proper Fountain format (NO MARKDOWN).`;
}

/**
 * Build rewrite prompt with selected text and context
 * @param {string} message - User's rewrite request
 * @param {string} selectedText - Selected text to rewrite
 * @param {Object} sceneContext - Scene context from detectCurrentScene
 * @param {Object} surroundingText - { before: string, after: string } - Text before/after selection
 * @returns {string} Formatted prompt for rewrite
 */
export function buildRewritePrompt(message, selectedText, sceneContext, surroundingText = null) {
  let contextInfo = '';
  
  // Add surrounding text for seamless integration
  if (surroundingText?.before) {
    contextInfo += `Text BEFORE the selected section (maintain continuity with this):\n"${surroundingText.before}"\n\n`;
  }
  
  contextInfo += `Selected text to rewrite:\n"${selectedText}"\n\n`;
  
  if (surroundingText?.after) {
    contextInfo += `Text AFTER the selected section (maintain continuity with this):\n"${surroundingText.after}"\n\n`;
  }
  
  // Add scene context if available
  if (sceneContext) {
    if (sceneContext.heading) {
      contextInfo += `Current scene: ${sceneContext.heading}\n`;
    }
    if (sceneContext.characters && sceneContext.characters.length > 0) {
      contextInfo += `Characters in scene: ${sceneContext.characters.join(', ')}\n`;
    }
    contextInfo += '\n';
  }
  
  // Check if user provided a generic/default rewrite request (should generate 3 options)
  const isGenericRequest = !message || 
    message.toLowerCase().includes('provide 3') || 
    message.toLowerCase().includes('three options') ||
    message.toLowerCase().includes('3 different') ||
    message.trim() === '' ||
    message.toLowerCase() === 'rewrite this' ||
    message.toLowerCase() === 'rewrite';
  
  if (isGenericRequest) {
    // Auto-generate 3 rewrite options
    return `${contextInfo}User wants 3 different rewrite options for the selected text.

CRITICAL INSTRUCTIONS:
1. Provide EXACTLY 3 different rewrite options
2. Each option should be a different approach/tone/style
3. Format as:
   Option 1 - [Brief description]:
   [Rewritten text in Fountain format]
   
   Option 2 - [Brief description]:
   [Rewritten text in Fountain format]
   
   Option 3 - [Brief description]:
   [Rewritten text in Fountain format]

4. Maintain Fountain screenplay format for each option
5. Keep the same scene location: ${sceneContext?.heading || 'current scene'} - NO scene headings
6. Use ONLY these characters: ${sceneContext?.characters?.join(', ') || 'existing characters'}
7. Match the length of the original text approximately
8. BLEND SEAMLESSLY with surrounding text (see before/after context above)
9. Character names in ALL CAPS only when speaking
10. NO markdown formatting (no **, no *, no ---)
11. Each option should be clearly separated and labeled

Output: 3 distinct rewrite options in the format above.`;
  }
  
  const fullPrompt = `${contextInfo}User's rewrite request: "${message}"

CRITICAL INSTRUCTIONS:
1. Write ONLY what the user requested - be LITERAL
2. If they say "make this more dramatic", intensify the existing content without adding new elements
3. If they say "make this concise", shorten it without changing the meaning
4. If they say "add dialogue", add ONLY dialogue - no extra action
5. Maintain Fountain screenplay format
6. Keep the same scene location: ${sceneContext?.heading || 'current scene'} - NO scene headings
7. Use ONLY these characters: ${sceneContext?.characters?.join(', ') || 'existing characters'}
8. Match the length of the original text unless specifically asked to expand/shorten
9. BLEND SEAMLESSLY with surrounding text (see before/after context above)
10. Do NOT repeat information from surrounding text
11. Do NOT add excessive detail beyond the request
12. Output ONLY the rewritten selection - nothing before, nothing after
13. Character names in ALL CAPS only when speaking
14. This is STANDALONE - ignore previous responses
15. NO explanations, NO questions, NO meta-commentary, NO suggestions, NO alternatives
16. Do NOT provide multiple options - just provide ONE rewritten version
17. Start directly with the rewritten screenplay content - no intro text

Format: Pure Fountain screenplay text matching the user's specific request. Output ONLY the rewritten text.`;
  
  return fullPrompt;
}

