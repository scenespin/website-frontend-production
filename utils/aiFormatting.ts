/**
 * Utility functions for formatting AI-generated content into Fountain screenplay format
 */

import { parseFountainDocument, formatElement, FountainElementType } from './fountain';

/**
 * Ensures AI-generated text is properly formatted for Fountain screenplay
 * Adds proper spacing and validates format
 */
export function ensureFountainFormatting(aiGeneratedText: string): string {
    // Preserve the original text if it's already well-formatted
    const lines = aiGeneratedText.split('\n');
    const formattedLines: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        
        // Preserve empty lines (important for screenplay formatting)
        if (!trimmed) {
            formattedLines.push('');
            continue;
        }
        
        // Scene headings should be uppercase
        if (/^(INT|EXT|EST|INT\.?\/EXT|I\/E)[\.\s]/i.test(trimmed)) {
            formattedLines.push(trimmed.toUpperCase());
            continue;
        }
        
        // Character names should be uppercase (if they look like character names)
        if (/^[A-Z\s]+$/.test(trimmed) && trimmed.length < 40 && i < lines.length - 1) {
            const nextLine = lines[i + 1]?.trim();
            // Check if next line is dialogue (not uppercase, not empty)
            if (nextLine && !(/^[A-Z\s]+$/.test(nextLine))) {
                formattedLines.push(trimmed.toUpperCase());
                continue;
            }
        }
        
        // Transitions should be uppercase and right-aligned
        if (/TO:$/.test(trimmed)) {
            formattedLines.push(trimmed.toUpperCase());
            continue;
        }
        
        // Preserve other lines as-is (action, dialogue, parentheticals)
        formattedLines.push(line);
    }
    
    return formattedLines.join('\n');
}

/**
 * Validates that AI-generated content follows Fountain conventions
 */
export function validateFountainContent(content: string): {
    isValid: boolean;
    issues: string[];
} {
    const issues: string[] = [];
    const elements = parseFountainDocument(content);
    
    let previousType: FountainElementType | null = null;
    
    for (const element of elements) {
        // Check for common formatting issues
        
        // Scene headings should be followed by action or character
        if (previousType === 'scene_heading' && element.type === 'dialogue') {
            issues.push(`Line ${element.lineNumber}: Dialogue should not directly follow scene heading`);
        }
        
        // Character names should be followed by dialogue or parenthetical
        if (previousType === 'character' && 
            element.type !== 'dialogue' && 
            element.type !== 'parenthetical' &&
            element.type !== 'empty') {
            issues.push(`Line ${element.lineNumber}: Character name should be followed by dialogue`);
        }
        
        // Dialogue should follow character or parenthetical
        if (element.type === 'dialogue' && 
            previousType !== 'character' && 
            previousType !== 'parenthetical' && 
            previousType !== 'dialogue') {
            issues.push(`Line ${element.lineNumber}: Dialogue should follow character name`);
        }
        
        previousType = element.type;
    }
    
    return {
        isValid: issues.length === 0,
        issues
    };
}

/**
 * Adds contextual instructions to AI prompts to ensure Fountain formatting
 */
export function getFountainFormattingInstructions(): string {
    return `
IMPORTANT: Format your response as a Fountain screenplay:
- Scene headings must start with INT., EXT., EST., INT./EXT., or I/E and be in ALL CAPS
- Character names must be in ALL CAPS and centered
- Dialogue follows character names (never start dialogue without a character name)
- Action/description is in regular case
- Parentheticals are wrapped in (parentheses)
- Transitions like "CUT TO:" or "FADE TO:" are in ALL CAPS
- Use blank lines to separate elements

Example format:
INT. COFFEE SHOP - DAY

JOHN enters, looking tired. He spots SARAH at a corner table.

JOHN
(nervous)
Hey, Sarah. Long time no see.

SARAH
John! I didn't expect to see you here.

FADE TO:
`.trim();
}

/**
 * Strips any markdown or non-Fountain formatting from AI responses
 */
export function stripNonFountainFormatting(text: string): string {
    return text
        // Remove markdown code blocks
        .replace(/```[a-z]*\n/g, '')
        .replace(/```/g, '')
        // Remove markdown bold/italic
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/\*(.+?)\*/g, '$1')
        .replace(/__(.+?)__/g, '$1')
        .replace(/_(.+?)_/g, '$1')
        // Remove markdown headers (keep the text)
        .replace(/^#+\s+/gm, '')
        // Keep the actual content clean
        .trim();
}

/**
 * Main function to process AI-generated content before insertion
 */
export function processAIGeneratedContent(rawContent: string): {
    formatted: string;
    validation: { isValid: boolean; issues: string[] };
} {
    // 1. Strip markdown and other non-Fountain formatting
    let processed = stripNonFountainFormatting(rawContent);
    
    // 2. Ensure proper Fountain formatting
    processed = ensureFountainFormatting(processed);
    
    // 3. Validate the result
    const validation = validateFountainContent(processed);
    
    return {
        formatted: processed,
        validation
    };
}

