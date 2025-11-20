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
  
  // 🔥 NEW: Detect emotional/descriptive statements (like "she's terrified", "hands are clammy")
  const isEmotionalDescription = /(is|are|was|were|becomes|becomes|feels|feeling|looks|seems)\s+(terrified|scared|afraid|angry|happy|sad|excited|nervous|anxious|calm|tense|relaxed|stressed|worried|confused|shocked|surprised|disgusted|proud|ashamed|embarrassed|jealous|lonely|tired|exhausted|energetic|focused|distracted|clammy|shaky|trembling|shaking|sweating|breathing|panting|gasping|hyperventilating)/i.test(message);
  
  // Note: Rewrite requests are now handled by RewriteModal, not the chat window
  // The chat window is ONLY for content generation (continuing the scene) or advice
  
  const isContentRequest = hasActionVerb || hasContentKeyword || isEmotionalDescription || (
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
/**
 * Build chat content prompt with JSON format (Phase 4: Structured Output)
 * @param {string} message - User's message
 * @param {Object} sceneContext - Scene context from detectCurrentScene
 * @param {boolean} useJSON - Whether to request JSON format (default: true for Phase 4)
 * @returns {string} Formatted prompt for content generation
 */
export function buildChatContentPrompt(message, sceneContext, useJSON = true) {
  const contextInfo = buildContextInfo(sceneContext);
  
  // 🔥 CRITICAL: Build limited context window around cursor (before and after)
  // This gives AI enough context to understand the scene without seeing the full scene
  let continuationContext = '';
  if (sceneContext?.contextBeforeCursor || sceneContext?.contextAfterCursor) {
    continuationContext = '\n\n[SCENE CONTEXT - Limited window around your cursor (for reference only, do NOT include in output)]:\n';
    
    if (sceneContext.contextBeforeCursor) {
      continuationContext += `...${sceneContext.contextBeforeCursor}\n`;
    }
    continuationContext += '← [CURSOR IS HERE - Continue from this point - DO NOT repeat anything above this line]\n';
    
    if (sceneContext.contextAfterCursor) {
      continuationContext += `${sceneContext.contextAfterCursor}...\n`;
    }
    
    continuationContext += '\n🔥 CRITICAL: The content above the cursor marker already exists in the screenplay. DO NOT include it in your output.';
  }

  // Phase 4: JSON Format Request
  if (useJSON) {
    return `${contextInfo}User's request: "${message}"

YOU ARE A SCREENPLAY WRITER - CONTINUE THE SCENE FROM THE CURSOR POSITION.

🚫 ABSOLUTELY FORBIDDEN:
- NO analysis, critique, or feedback about the story
- NO suggestions or alternatives
- NO questions (no "Should...?", "Want me to...?", "Would you like...?", etc.)
- NO explanations about why something is good or bad
- NO meta-commentary about writing or storytelling
- NO "This would..." or "This could..." statements
- NO "Consider..." or "Think about..." statements
- NO lists of options or alternatives
- NO scene headings (INT./EXT.) - NEVER include scene headings
- NO repeating content that already exists before the cursor
- NO rewriting the beginning of the scene - CONTINUE from where the cursor is

✅ YOU MUST RESPOND WITH VALID JSON ONLY:

{
  "content": ["line 1", "line 2", "line 3"],
  "lineCount": 3
}

JSON SCHEMA REQUIREMENTS:
- "content": Array of 1-5 strings (screenplay lines)
- "lineCount": Number matching content.length
- Each line in content array is a string (action or dialogue)
- NO scene headings in any line
- NO content that exists before the cursor
- NO markdown formatting in JSON
- NO explanations outside JSON

EXAMPLE JSON RESPONSE:
{
  "content": [
    "The download bar STOPS at 47%.",
    "A SPARK erupts from the back of her computer tower.",
    "Then another. WHOOSH — the tower EXPLODES in a burst of flame and smoke, throwing Sarah backward in her chair."
  ],
  "lineCount": 3
}

CRITICAL INSTRUCTIONS:
1. Respond with ONLY valid JSON - no markdown, no explanations, no code blocks
2. content array must have 1-5 items
3. Each item is a screenplay line (action or dialogue)
4. NO scene headings (INT./EXT.)
5. NO repeating content before cursor
6. lineCount must exactly match content.length${continuationContext}

OUTPUT: Only valid JSON object. Nothing else.`;
  }
  
  // Fallback: Original text format (for backward compatibility)
  return `${contextInfo}User's request: "${message}"

YOU ARE A SCREENPLAY WRITER - CONTINUE THE SCENE FROM THE CURSOR POSITION.

🚫 ABSOLUTELY FORBIDDEN:
- NO analysis, critique, or feedback about the story
- NO suggestions or alternatives
- NO questions (no "Should...?", "Want me to...?", "Would you like...?", etc.)
- NO explanations about why something is good or bad
- NO meta-commentary about writing or storytelling
- NO "This would..." or "This could..." statements
- NO "Consider..." or "Think about..." statements
- NO lists of options or alternatives
- NO scene headings (INT./EXT.) - NEVER include scene headings
- NO repeating content that already exists before the cursor
- NO rewriting the beginning of the scene - CONTINUE from where the cursor is

✅ YOU MUST ONLY:
Write 1-5 vivid screenplay elements in Fountain format. CONTINUE the scene from the cursor position - write ONLY what comes NEXT, not what came before.

CONTINUATION EXAMPLE:
User's cursor is after: "She starts downloading everything."
User requests: "the computer freezes and then explodes"
Output: "The download bar STOPS at 47%. A SPARK erupts from the back of her computer tower. Then another. WHOOSH — the tower EXPLODES in a burst of flame and smoke, throwing Sarah backward in her chair."

BAD EXAMPLE (DO NOT DO THIS):
User's cursor is after: "She starts downloading everything."
User requests: "the computer freezes and then explodes"
BAD Output:
# INT. NEWS OFFICE - NIGHT

The newsroom is empty now. Sarah's desk lamp is the only light on.

She opens the email from earlier. Her eyes widen.

She starts downloading everything.

The download bar STOPS at 47%...

❌ THIS IS WRONG because:
- It includes the scene heading (INT. NEWS OFFICE - NIGHT)
- It repeats content that already exists before the cursor
- It rewrites the entire scene instead of continuing from the cursor

GOOD EXAMPLE (DO THIS):
User's cursor is after: "She starts downloading everything."
User requests: "the computer freezes and then explodes"
GOOD Output:
The download bar STOPS at 47%. A SPARK erupts from the back of her computer tower. Then another. WHOOSH — the tower EXPLODES in a burst of flame and smoke, throwing Sarah backward in her chair.

✅ THIS IS CORRECT because:
- No scene heading
- No repetition of existing content
- Only new content continuing from the cursor

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
1. Write ONLY 1-5 lines - do NOT generate full scenes
2. CONTINUE from the cursor position - do NOT rewrite or repeat what came before
3. Do NOT include scene headings (INT./EXT.) - NEVER include scene headings
4. Do NOT write "REVISED SCENE:" or any headers
5. Do NOT ask questions (no "Should...?", "Want me to...?", etc.)
6. Do NOT repeat existing scene content - write ONLY the new content requested
7. Be DESCRIPTIVE and VISUAL for action
8. Include dialogue ONLY if user mentions speaking/talking/saying
9. Character names in ALL CAPS when they speak
10. Use active verbs and cinematic language
11. Current scene: ${sceneContext?.heading || 'INT. LOCATION - DAY'} (for context only - do NOT include in output)
12. Each request is standalone - write ONLY what they asked for
13. NO analysis, NO critique, NO suggestions, NO alternatives, NO "this would" or "this could"
14. NO meta-commentary, NO questions, NO explanations
15. NO notes like "This adds..." or "This creates..." - just write the content
16. If the user says "her computer explodes", write the explosion - do NOT analyze whether it's a good idea
17. If the user says "the computer freezes", write ONLY the freezing action - do NOT write the whole scene
18. 🔥 CRITICAL: The cursor is positioned AFTER existing content. Write ONLY what comes NEXT, not what came before.${continuationContext}

OUTPUT: Only the screenplay content they requested - nothing before, nothing after, no headers, no questions, no analysis, no scene headings, no meta-commentary, no repeating existing content.

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
15. Output only screenplay content - no explanations or suggestions

Format: Pure Fountain screenplay text matching the user's specific request.`;
  
  return fullPrompt;
}

