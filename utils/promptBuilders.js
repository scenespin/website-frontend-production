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
  
  // 🔥 MINIMAL: Just add context if available, then user's request
  let continuationContext = '';
  if (sceneContext?.contextBeforeCursor) {
    continuationContext = `\n\nContext: ${sceneContext.contextBeforeCursor.substring(0, 200)}...`;
  }

  // 🔥 CODE BLOCK APPROACH: Request Fountain format in code blocks (STRENGTHENED)
  const codeBlockInstruction = `\n\n🚫 DO NOT provide analysis, options, or explanations.\n\n✅ REQUIRED: Put your Fountain format output in a code block:\n\n\`\`\`fountain\n[your screenplay content here - 1-3 lines only]\n\`\`\`\n\nCRITICAL: The code block must contain ONLY the screenplay text. No analysis outside the code block.\n\nCRITICAL SPACING RULES (Fountain.io spec):\n- Character: ONE blank line BEFORE, NO blank line AFTER\n- Dialogue: NO blank line before, ONE blank line AFTER\n- Parenthetical: NO blank lines before/after\n- Action: ONE blank line BEFORE Character (if next is Character)`;

  // User's request + minimal context + code block instruction
  return `${message}${continuationContext}${codeBlockInstruction}`;
}

/**
 * Build screenwriter prompt for modal-based generation (JSON format)
 * @param {string} userMessage - User's prompt describing what to generate
 * @param {Object} sceneContext - Scene context from detectCurrentScene
 * @param {string} contextBefore - Optional text before cursor/selection for context
 * @param {boolean} useJSON - Whether to request JSON format (default: true)
 * @returns {string} Formatted prompt for screenwriter generation
 */
export function buildScreenwriterPrompt(userMessage, sceneContext, contextBefore = '', useJSON = true) {
  let prompt = userMessage;
  
  // Add context information if available
  if (contextBefore) {
    prompt += `\n\nContext from screenplay (what comes before):\n${contextBefore.substring(0, 200)}`;
  }
  
  if (sceneContext) {
    const contextInfo = buildContextInfo(sceneContext);
    if (contextInfo) {
      prompt += `\n\n${contextInfo}`;
    }
  }
  
  if (useJSON) {
    prompt += `\n\nGenerate 1-3 lines of Fountain format screenplay text. Respond with ONLY valid JSON:
{
  "content": ["line 1", "line 2", "line 3"],
  "lineCount": 3
}

Rules:
- NO scene headings (INT./EXT.) - this is a continuation
- Character names in ALL CAPS when speaking
- Character extensions are valid: CHARACTER (O.S.), CHARACTER (V.O.), CHARACTER (CONT'D)
- Action lines in normal case
- Emphasis: Fountain uses *italics*, **bold**, _underline_ for emphasis (use sparingly)
- NO markdown formatting (no # headers, no ---, no markdown syntax)
- Use ellipses (...) for pauses, hesitations, or trailing off in dialogue
- Double dashes (--) are valid in Fountain but should be used sparingly, primarily in action lines for dramatic pauses. Prefer ellipses (...) in dialogue.
- CRITICAL: Do NOT add timing metadata, pause durations, or audio generation instructions. Fountain format uses ellipses (...) for pauses - the system handles timing automatically. Do NOT write "meta pause secs", "pause 0.7", "hashtag meta pause", or any timing information.
- Just 1-3 content elements (can include blank lines for proper spacing, up to 10 items total)

CRITICAL SPACING RULES (Fountain.io spec):
- Character: ONE blank line BEFORE, NO blank line AFTER
- Dialogue: NO blank line before, ONE blank line AFTER
- Parenthetical: NO blank lines before/after
- Action: ONE blank line BEFORE Character (if next is Character)`;
  }
  
  return prompt;
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
 * Build director modal prompt (for modal-based UI with scene directions)
 * @param {Array} sceneDirections - Array of {location, scenario, direction} objects
 * @param {Object} sceneContext - Scene context from detectCurrentScene
 * @param {string} contextBefore - Context text before cursor/selection
 * @param {boolean} useJSON - Whether to use JSON format (structured output)
 * @returns {string} Formatted prompt for Director modal
 */
export function buildDirectorModalPrompt(sceneDirections, sceneContext, contextBefore = '', useJSON = true) {
  const contextInfo = buildContextInfo(sceneContext);
  
  // Build scene direction prompts
  let scenePrompts = '';
  sceneDirections.forEach((scene, index) => {
    scenePrompts += `Scene ${index + 1}:\n`;
    scenePrompts += `Location: ${scene.location}\n`;
    scenePrompts += `Scenario: ${scene.scenario}\n`;
    if (scene.direction && scene.direction.trim()) {
      scenePrompts += `Direction: ${scene.direction}\n`;
    }
    scenePrompts += '\n';
  });

  // Add context if available
  let contextSection = '';
  if (contextBefore) {
    contextSection = `\n\nContext from screenplay:\n${contextBefore.substring(0, 200)}...\n`;
  }
  if (sceneContext?.heading) {
    contextSection += `Current scene: ${sceneContext.heading}\n`;
  }

  if (useJSON) {
    return `${contextInfo}Generate ${sceneDirections.length} complete scene${sceneDirections.length > 1 ? 's' : ''} based on the following directions:

${scenePrompts}${contextSection}

Generate all scenes in JSON format:
{
  "scenes": [
    {
      "heading": "INT. LOCATION - TIME",
      "content": ["action line", "CHARACTER", "dialogue", ...]
    },
    ...
  ],
  "totalLines": 15
}

Rules:
- Each scene MUST have its own scene heading (INT./EXT. LOCATION - TIME)
- Each scene: 5-30 lines of content
- NO markdown formatting
- Character names in ALL CAPS when speaking
- Action lines in normal case
- Create NEW scenes that come AFTER the current scene "${sceneContext?.heading || 'current scene'}"
- Do NOT repeat or rewrite the current scene`;
  }

  // Fallback (not used in modal, but for consistency)
  return `${contextInfo}Generate ${sceneDirections.length} complete scene${sceneDirections.length > 1 ? 's' : ''}:\n\n${scenePrompts}${contextSection}`;
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
- Use ellipses (...) for pauses, hesitations, or trailing off in dialogue
- Double dashes (--) are valid in Fountain (see official spec example) but should be used sparingly, primarily in action lines for dramatic pauses. Prefer ellipses (...) in dialogue.
- CRITICAL: Do NOT add timing metadata, pause durations, or audio generation instructions. Fountain format uses ellipses (...) for pauses - the system handles timing automatically. Do NOT write "meta pause secs", "pause 0.7", "hashtag meta pause", or any timing information.
- Transitions (CUT TO:, FADE OUT.) are valid but use sparingly - modern screenwriting typically omits them except at act breaks
- NO "FADE OUT" or "THE END" unless user requests ending
- 🚫 ABSOLUTELY FORBIDDEN: NO "REVISED SCENE", "REVISION", "REWRITTEN SCENE", or any revision headers
- 🚫 ABSOLUTELY FORBIDDEN: Do NOT rewrite, revise, or modify the current scene "${sceneContext?.heading || 'current scene'}"
- 🚫 ABSOLUTELY FORBIDDEN: Do NOT rewrite, revise, or modify ANY existing scenes
- 🚫 CRITICAL: Do NOT include "${sceneContext?.heading || 'current scene'}" in your response. The FIRST scene must be a DIFFERENT location.
- Each scene must have different location/time than "${sceneContext?.heading || 'current scene'}"
- Do NOT repeat the current scene "${sceneContext?.heading || 'current scene'}" - create NEW scenes
- Create ONLY NEW scenes that come AFTER the current scene
- Write in Fountain format with proper newlines

CRITICAL SPACING RULES (Fountain.io spec - MUST FOLLOW):
- Character: ONE blank line BEFORE, NO blank line AFTER
- Dialogue: NO blank line before (follows Character/Parenthetical immediately)
- Dialogue: ONE blank line AFTER (before next Action/Character)
- Parenthetical: NO blank line before/after (flows directly)
- Action: ONE blank line BEFORE Character (if next is Character)

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
4. 🔥 CRITICAL: Scene headings ARE REQUIRED - ${generationLength === 'multiple' ? `EXACTLY ${sceneCount} NEW scenes` : '1 NEW scene'} MUST start with its own scene heading (INT./EXT. LOCATION - TIME). Do NOT repeat the current scene heading "${sceneContext?.heading || 'INT. LOCATION - TIME'}". Create NEW scenes with NEW locations/times.
5. 🚫 ABSOLUTELY FORBIDDEN: Do NOT continue the current scene. The Director agent creates NEW scenes, not continuations. The Screenwriter agent handles scene continuation.
6. 🚫 ABSOLUTELY FORBIDDEN: Do NOT repeat, rewrite, revise, or modify the current scene "${sceneContext?.heading || 'current scene'}". Create ${generationLength === 'multiple' ? `EXACTLY ${sceneCount} COMPLETELY NEW scenes` : '1 COMPLETELY NEW scene'} that come AFTER the current scene and advance the story forward.
7. 🚫 ABSOLUTELY FORBIDDEN: Do NOT rewrite, revise, or modify ANY existing scenes. Only create NEW scenes.
8. 🚫 ABSOLUTELY FORBIDDEN: NO "REVISED SCENE", "REVISION", "REWRITTEN SCENE", "REWRITTEN", or any revision headers - just write NEW scenes
9. 🚫 CRITICAL: If you generate ${generationLength === 'multiple' ? `${sceneCount} scenes` : '1 scene'}, ALL ${generationLength === 'multiple' ? sceneCount : 1} scenes must be NEW scenes. Do NOT count a revised version of the current scene as one of the scenes.
10. NO "NEW SCENE ADDITION" or any other headers - just the screenplay content
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

7. FOUNTAIN FORMAT (CRITICAL):
   - Character names in ALL CAPS
   - Example: SARAH (NOT **SARAH** or *SARAH* - those are for emphasis, not character names)
   - Character extensions are valid: CHARACTER (O.S.), CHARACTER (V.O.), CHARACTER (CONT'D)
   - Parentheticals in parentheses: (examining the USB drive)
   - Dialogue in plain text below character name
   - Action lines in normal case
   - Scene headings in ALL CAPS: INT. LOCATION - TIME
   - Transitions are valid but use sparingly: CUT TO:, FADE OUT. (modern screenwriting typically omits them except at act breaks)
   - Emphasis: Fountain uses *italics*, **bold**, _underline_ for emphasis (use sparingly)
   - NO markdown formatting (no # headers, no ---, no markdown syntax)
   - Use ellipses (...) for pauses, hesitations, or trailing off in dialogue
   - Double dashes (--) are valid in Fountain but should be used sparingly, primarily in action lines for dramatic pauses. Prefer ellipses (...) in dialogue.
   
   CRITICAL SPACING RULES (Fountain.io spec - MUST FOLLOW):
   - Character: ONE blank line BEFORE, NO blank line AFTER
   - Dialogue: NO blank line before (follows Character/Parenthetical immediately)
   - Dialogue: ONE blank line AFTER (before next Action/Character)
   - Parenthetical: NO blank line before/after (flows directly)
   - Action: ONE blank line BEFORE Character (if next is Character)
   
   Example format (note spacing):
   
   Action line here.
   
   SARAH
   (examining the USB drive)
   What does that mean?
   
   More action.

8. THOROUGHNESS: Be comprehensive and detailed. This is the Director agent - generate MORE content, not less. Fill out scenes with rich detail, multiple beats, and complete moments.

9. OUTPUT ONLY: Provide ONLY the screenplay content. Do NOT add explanations, questions, or meta-commentary at the end. Do NOT add "REVISED SCENE" or "REVISION" headers. Do NOT add timing metadata, pause durations, or audio generation instructions (e.g., "meta pause secs 0.7", "pause 0.5", etc.).

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
12. 🚫 ABSOLUTELY FORBIDDEN: NO double dashes (--) or single dashes (-) in dialogue or action lines. Fountain format does NOT use dashes. Use ellipses (...) for pauses or interruptions instead.

CRITICAL SPACING RULES (Fountain.io spec):
- Character: ONE blank line BEFORE, NO blank line AFTER
- Dialogue: NO blank line before (follows Character/Parenthetical immediately)
- Dialogue: ONE blank line AFTER (before next Action/Character)
- Parenthetical: NO blank line before/after (flows directly)
- Action: ONE blank line BEFORE Character (if next is Character)

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
- Character extensions are valid: CHARACTER (O.S.), CHARACTER (V.O.), CHARACTER (CONT'D)
- Emphasis: Fountain uses *italics*, **bold**, _underline_ for emphasis (use sparingly)
- NO markdown formatting (no # headers, no ---, no markdown syntax)
- Use ellipses (...) for pauses, hesitations, or trailing off in dialogue
- Double dashes (--) are valid in Fountain but should be used sparingly, primarily in action lines for dramatic pauses. Prefer ellipses (...) in dialogue.
- Match Fountain format with proper newlines
- Blend with surrounding text

CRITICAL SPACING RULES (Fountain.io spec):
- Character: ONE blank line BEFORE, NO blank line AFTER
- Dialogue: NO blank line before (follows Character/Parenthetical immediately)
- Dialogue: ONE blank line AFTER (before next Action/Character)
- Parenthetical: NO blank line before/after (flows directly)
- Action: ONE blank line BEFORE Character (if next is Character)`;
  }
  
  // Fallback: Simplified text format (primary reliable path)
  return `${contextInfo}Rewrite the selected text: "${message}"

${surroundingText?.before ? `Context before: "${surroundingText.before}"` : ''}
${surroundingText?.after ? `Context after: "${surroundingText.after}"` : ''}

Rules:
- Write what the user requested
- NO scene headings
- NO markdown (no **, no #)
- Use ellipses (...) for pauses, hesitations, or trailing off in dialogue
- Double dashes (--) are valid in Fountain (see official spec example) but should be used sparingly, primarily in action lines for dramatic pauses. Prefer ellipses (...) in dialogue.
- Match Fountain format with proper newlines
- Blend with surrounding text
- Output only the rewritten text

CRITICAL SPACING RULES (Fountain.io spec):
- Character: ONE blank line BEFORE, NO blank line AFTER
- Dialogue: NO blank line before (follows Character/Parenthetical immediately)
- Dialogue: ONE blank line AFTER (before next Action/Character)
- Parenthetical: NO blank line before/after (flows directly)
- Action: ONE blank line BEFORE Character (if next is Character)`;
  
  return fullPrompt;
}

/**
 * Build dialogue prompt (for modal-based UI with form data)
 * @param {Object} formData - Form data object with sceneHeading, act, characters, conflict, tone, subtext, etc.
 * @param {Object} sceneContext - Scene context from detectCurrentScene
 * @param {boolean} useJSON - Whether to use JSON format (structured output)
 * @returns {string} Formatted prompt for Dialogue modal
 */
export function buildDialoguePrompt(formData, sceneContext, useJSON = true) {
  const contextInfo = buildContextInfo(sceneContext);
  
  // Build prompt from form data
  let prompt = `${contextInfo}Generate compelling screenplay dialogue based on the following context:\n\n`;
  
  if (formData.sceneHeading) {
    prompt += `Scene: ${formData.sceneHeading}\n`;
  }
  if (formData.act) {
    prompt += `Act: ${formData.act}\n`;
  }
  if (formData.characters && formData.characters.length > 0) {
    prompt += `Characters: ${formData.characters.join(', ')}\n`;
  }
  if (formData.conflict) {
    prompt += `Conflict/Tension: ${formData.conflict}\n`;
  }
  if (formData.tone) {
    prompt += `Tone: ${formData.tone}\n`;
  }
  if (formData.subtext) {
    prompt += `Subtext: ${formData.subtext}\n`;
  }
  if (formData.characterWants) {
    prompt += `Character Wants: ${formData.characterWants}\n`;
  }
  if (formData.powerDynamics) {
    prompt += `Power Dynamics: ${formData.powerDynamics}\n`;
  }
  if (formData.specificLines) {
    prompt += `Specific Lines to Include: ${formData.specificLines}\n`;
  }

  if (useJSON) {
    prompt += `\n\nGenerate dialogue in JSON format:
{
  "dialogue": [
    {"character": "CHARACTER", "line": "dialogue text", "subtext": "optional subtext"},
    ...
  ],
  "breakdown": "optional analysis"
}

Rules:
- Character names in ALL CAPS
- Natural, realistic dialogue
- Subtext where appropriate
- NO markdown formatting
- Each exchange should advance the scene`;
  }

  return prompt;
}

