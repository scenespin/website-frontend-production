/**
 * Dialogue Generation Prompt Utilities
 * 
 * These functions build prompts for the Dialogue Agent, optimizing for:
 * - Professional screenplay formatting
 * - Subtext and character depth
 * - Contextual awareness (scene, act, characters)
 */

export interface DialogueContext {
    sceneHeading: string;
    act: number;
    characters: Array<{
        id: string;
        name: string;
        type?: string;
        description?: string;
    }>;
    conflict: string;
    tone: string;
    subtext?: string;
    desiredOutcome?: string;
    powerDynamics?: string;
    specificLines?: string;
    characterWants?: { [characterId: string]: string };
}

/**
 * Generate a quick dialogue prompt from context
 */
export function generateQuickDialoguePrompt(context: DialogueContext): string {
    const charactersList = context.characters.map(c => c.name).join(', ');
    
    let prompt = `Generate professional screenplay dialogue for this scene:

**Scene**: ${context.sceneHeading || 'Not specified'}
**Act**: ${context.act}
**Characters**: ${charactersList || 'Not specified'}
**Conflict/Tension**: ${context.conflict}
**Tone**: ${context.tone}`;

    if (context.subtext) {
        prompt += `\n**Subtext**: ${context.subtext}`;
    }

    if (context.desiredOutcome) {
        prompt += `\n**Desired Outcome**: ${context.desiredOutcome}`;
    }

    if (context.powerDynamics) {
        prompt += `\n**Power Dynamics**: ${context.powerDynamics}`;
    }

    if (context.specificLines) {
        prompt += `\n**Specific Lines/Moments**: ${context.specificLines}`;
    }

    prompt += `\n\n**Instructions**:
1. Write the dialogue in proper screenplay format
2. Show character names in ALL CAPS before their lines
3. Include parentheticals for important actions or delivery
4. Make the dialogue feel natural and realistic
5. Incorporate subtext - what's NOT being said is as important as what is
6. Each character should have a distinct voice
7. Use beats (pauses) where appropriate
8. Keep it concise but impactful

Generate the dialogue now:`;

    return prompt;
}

/**
 * Generate a guided interview prompt (AI asks questions)
 */
export function generateGuidedDialoguePrompt(): string {
    return `You are a professional screenwriting dialogue coach. I need help writing a scene, and I'd like you to guide me through it by asking questions.

Start by asking me about:
1. The scene setting (location and time of day)
2. Which characters are in the scene
3. What the main conflict or tension is
4. The emotional tone I'm going for

Ask ONE question at a time, and wait for my response before moving to the next question. Once you have enough information, you'll generate the dialogue for me.

Let's start - ask me your first question.`;
}

/**
 * Generate a prompt for refining existing dialogue
 */
export function generateDialogueRefinementPrompt(
    existingDialogue: string,
    refinementRequest: string
): string {
    return `Here's some screenplay dialogue I've written:

${existingDialogue}

**Refinement Request**: ${refinementRequest}

Please revise the dialogue based on my request. Maintain proper screenplay format and keep the essence of the scene while improving it according to my feedback.

Revised dialogue:`;
}

/**
 * Generate a prompt for adding subtext to dialogue
 */
export function generateSubtextPrompt(
    dialogue: string,
    subtextDescription: string
): string {
    return `Here's a piece of screenplay dialogue:

${dialogue}

I want to add more subtext. Here's what's going on beneath the surface:
${subtextDescription}

Please rewrite the dialogue to incorporate this subtext. The characters should be saying one thing but meaning another. Use:
- Indirect language
- Avoidance tactics
- Double meanings
- Pauses and hesitations
- Subject changes

Keep it in proper screenplay format.

Rewritten dialogue with subtext:`;
}

/**
 * Generate a prompt for dialogue based on character wants
 */
export function generateCharacterWantsPrompt(
    context: DialogueContext,
    characterWants: { [characterName: string]: string }
): string {
    const wantsList = Object.entries(characterWants)
        .map(([name, want]) => `- ${name}: ${want}`)
        .join('\n');

    const charactersList = context.characters.map(c => c.name).join(', ');

    return `Generate screenplay dialogue where each character is trying to get what they want from the scene.

**Scene**: ${context.sceneHeading}
**Characters**: ${charactersList}
**Conflict**: ${context.conflict}
**Tone**: ${context.tone}

**What Each Character Wants**:
${wantsList}

The dialogue should show characters pursuing their objectives while dealing with the conflict. They may try different tactics, manipulate, persuade, or confront. Make it dynamic and realistic.

Generate the dialogue in proper screenplay format:`;
}

/**
 * Build context string for API call
 */
export function buildDialogueApiContext(context: DialogueContext): string {
    return JSON.stringify({
        sceneHeading: context.sceneHeading,
        act: context.act,
        characters: context.characters,
        conflict: context.conflict,
        tone: context.tone,
        subtext: context.subtext,
        desiredOutcome: context.desiredOutcome,
        powerDynamics: context.powerDynamics
    });
}
