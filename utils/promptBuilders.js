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
    
    continuationContext += '\n🔥 CRITICAL: The content above the cursor marker already exists in the screenplay. DO NOT include it in your output. DO NOT repeat any of the text shown above the cursor marker.';
  }

  // Simplified prompt - JSON optional, text cleaning is primary
  if (useJSON) {
    return `${contextInfo}Continue the scene from the cursor. Write 1-5 lines of action or dialogue.

${continuationContext}

Respond with JSON:
{
  "content": ["line 1", "line 2"],
  "lineCount": 2
}

Rules:
- NO scene headings (INT./EXT.)
- NO repeating content before cursor
- NO dashes (-- or -) in action lines
- Just write what comes next`;
  }
  
  // Fallback: Simplified text format (primary reliable path)
  return `${contextInfo}Continue the scene from the cursor. Write 1-5 lines of action or dialogue.

${continuationContext}

Rules:
- NO scene headings (INT./EXT.)
- NO repeating content before cursor
- NO dashes (-- or -) in action lines
- NO analysis, suggestions, or questions
- Just write what comes next in the scene`;
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
 * @param {boolean} useJSON - Whether to use JSON format (structured output)
 * @returns {string} Formatted prompt for Director mode
 */
export function buildDirectorPrompt(message, sceneContext, generationLength = 'full', useJSON = true, sceneCount = 3) {
  const contextInfo = buildContextInfo(sceneContext);
  
  // Define length requirements based on generationLength
  let lengthInstruction = '';
  let sceneCountInstruction = '';
  let minLines = 5;
  let maxLines = 10;
  
  switch (generationLength) {
    case 'short':
      lengthInstruction = '5-10 lines of screenplay';
      sceneCountInstruction = 'ONE scene only';
      minLines = 5;
      maxLines = 15;
      break;
    case 'full':
      lengthInstruction = '15-30 lines of screenplay (a complete, full scene)';
      sceneCountInstruction = 'ONE complete scene';
      minLines = 15;
      maxLines = 50;
      break;
    case 'multiple':
      lengthInstruction = `${sceneCount} complete scenes (each 15-30 lines)`;
      sceneCountInstruction = `EXACTLY ${sceneCount} complete scenes with proper scene headings`;
      minLines = sceneCount * 15; // Minimum: 15 lines per scene
      maxLines = sceneCount * 50; // Maximum: 50 lines per scene (allows for longer scenes)
      break;
    default:
      lengthInstruction = '15-30 lines of screenplay';
      sceneCountInstruction = 'ONE complete scene';
      minLines = 15;
      maxLines = 50;
  }
  
  // JSON Format (Phase 4: Structured Output) - Matching Screenwriter agent format
  if (useJSON) {
    return `${contextInfo}User's request: "${message}"

Write ${generationLength === 'multiple' ? `${sceneCount} new scenes` : '1 new scene'} that come after the current scene.

${generationLength === 'multiple' ? `Generate EXACTLY ${sceneCount} complete scenes. Each scene must have its own scene heading (INT./EXT. LOCATION - TIME).` : 'Generate 1 complete scene with a scene heading (INT./EXT. LOCATION - TIME).'}

${useJSON ? `Respond with JSON:
{
  "content": ["INT. LOCATION - TIME", "action line", "dialogue", ...],
  "lineCount": [number]
}` : 'Write in Fountain format:'}

Rules:
- NO analysis, suggestions, or questions - just write scenes
- NO markdown formatting (no **, no #, no ---)
- NO dashes (-- or -) in action lines
- NO "FADE OUT" or "THE END" unless user requests ending
- NO "Revised Scene" or other headers
- Each scene must have different location/time than "${sceneContext?.heading || 'current scene'}"
- Write in Fountain format with proper newlines

EXAMPLE JSON RESPONSE (for ${generationLength === 'short' ? 'short' : generationLength === 'multiple' ? 'multiple scenes' : 'full scene'}):
{
  "content": [
    "Sarah sits up straighter, grabbing her pen.",
    "",
    "SARAH",
    "Who is this?",
    "",
    "VOICE (V.O.)",
    "(digitally altered)",
    "Someone who knows what you're capable of. Check your home address tonight. Come alone. Tell no one.",
    "",
    "The line goes DEAD.",
    "",
    "Sarah stares at her phone, pulse quickening."
  ],
  "lineCount": 11
}

CRITICAL INSTRUCTIONS:
1. Respond with ONLY valid JSON - no markdown, no explanations, no code blocks, no markdown code block wrappers
2. content array must have ${minLines}-${maxLines} items
3. Each item is a screenplay line (action, dialogue, scene heading)
4. 🔥 CRITICAL: Scene headings ARE REQUIRED - ${generationLength === 'multiple' ? `Each of the ${sceneCount} new scenes` : 'The new scene'} MUST start with its own scene heading (INT./EXT. LOCATION - TIME). Do NOT repeat the current scene heading "${sceneContext?.heading || 'INT. LOCATION - TIME'}". Create NEW scenes with NEW locations/times.
5. 🚫 ABSOLUTELY FORBIDDEN: Do NOT continue the current scene. The Director agent creates NEW scenes, not continuations. The Screenwriter agent handles scene continuation.
6. 🚫 ABSOLUTELY FORBIDDEN: Do NOT repeat or revise the current scene. Create ${generationLength === 'multiple' ? `${sceneCount} COMPLETELY NEW scenes` : '1 COMPLETELY NEW scene'} that come AFTER the current scene and advance the story forward.
7. NO "REVISED SCENE", "REVISION", "NEW SCENE ADDITION", or any headers - just the screenplay content
8. lineCount must exactly match content.length
9. Empty strings in content array are allowed for spacing (screenplay formatting)
10. 🔥 CRITICAL: Output ONLY the raw JSON object. Do NOT wrap it in markdown code blocks. Do NOT add any text before or after the JSON.

OUTPUT: Only valid JSON object. Nothing else. No markdown. No explanations. Just JSON.`;
  }
  
  // Fallback: Original text format (for backward compatibility)
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

9. OUTPUT ONLY: Provide ONLY the screenplay content. Do NOT add explanations, questions, or meta-commentary at the end. Do NOT add "REVISED SCENE" or "REVISION" headers.

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
export function buildRewritePrompt(message, selectedText, sceneContext, surroundingText = null, useJSON = false) {
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
12. 🚫 NO DASHES: Do NOT use double dashes (--) or single dashes (-) in action lines. Avoid dashes entirely unless absolutely necessary for clarity. Very rare exception only.

Output: 3 distinct rewrite options in the format above.`;
  }
  
  // Simplified rewrite prompt - JSON optional
  if (useJSON) {
    return `${contextInfo}Rewrite the selected text: "${message}"

${surroundingText?.before ? `Context before: "${surroundingText.before}"` : ''}
${surroundingText?.after ? `Context after: "${surroundingText.after}"` : ''}

Respond with JSON:
{
  "rewrittenText": "rewritten text here"
}

Rules:
- NO scene headings
- NO markdown (no **, no #)
- NO dashes (-- or -) in action lines
- Match Fountain format with proper newlines
- Blend with surrounding text`;
  }
  
  // Fallback: Simplified text format (primary reliable path)
  return `${contextInfo}Rewrite the selected text: "${message}"

${surroundingText?.before ? `Context before: "${surroundingText.before}"` : ''}
${surroundingText?.after ? `Context after: "${surroundingText.after}"` : ''}

Rules:
- Write what the user requested
- NO scene headings
- NO markdown (no **, no #)
- NO dashes (-- or -) in action lines
- Match Fountain format with proper newlines
- Blend with surrounding text
- Output only the rewritten text`;
  
  return fullPrompt;
}

