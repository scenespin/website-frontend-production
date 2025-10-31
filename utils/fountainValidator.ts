/**
 * Fountain Format Validator
 * 
 * Detects common formatting issues in screenplay content and suggests corrections.
 */

import { detectElementType, FountainElementType } from './fountain';

export type IssueSeverity = 'error' | 'warning' | 'info';

export interface FormatIssue {
    lineNumber: number;
    severity: IssueSeverity;
    type: 'character' | 'scene_heading' | 'dialogue' | 'spacing' | 'general';
    description: string;
    originalText: string;
    suggestedFix?: string;
}

export interface ValidationResult {
    isValid: boolean;
    issues: FormatIssue[];
    hasAutoFixableIssues: boolean;
}

/**
 * Validate Fountain screenplay content and detect formatting issues
 */
export function validateFountainContent(content: string): ValidationResult {
    const lines = content.split('\n');
    const issues: FormatIssue[] = [];
    let previousType: FountainElementType | undefined;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        const elementType = detectElementType(line, previousType);
        
        // Skip empty lines
        if (!trimmed) {
            previousType = elementType;
            continue;
        }
        
        // Check for character name issues
        const characterIssue = detectCharacterIssues(trimmed, i, previousType);
        if (characterIssue) {
            issues.push(characterIssue);
        }
        
        // Check for scene heading issues
        const sceneIssue = detectSceneHeadingIssues(trimmed, i);
        if (sceneIssue) {
            issues.push(sceneIssue);
        }
        
        // Check for dialogue formatting issues
        const dialogueIssue = detectDialogueIssues(trimmed, i, previousType);
        if (dialogueIssue) {
            issues.push(dialogueIssue);
        }
        
        // Check for spacing issues
        if (i > 0) {
            const spacingIssue = detectSpacingIssues(lines, i, elementType, previousType);
            if (spacingIssue) {
                issues.push(spacingIssue);
            }
        }
        
        previousType = elementType;
    }
    
    const hasAutoFixableIssues = issues.some(issue => issue.suggestedFix !== undefined);
    
    return {
        isValid: issues.length === 0,
        issues,
        hasAutoFixableIssues
    };
}

/**
 * Detect character name formatting issues
 */
function detectCharacterIssues(
    line: string, 
    lineNumber: number, 
    previousType?: FountainElementType
): FormatIssue | null {
    // Check for colon-separated dialogue format (JOHN: Hello)
    const colonMatch = line.match(/^([A-Za-z][A-Za-z\s']+):\s*(.+)$/);
    if (colonMatch) {
        const characterName = colonMatch[1].trim();
        const dialogue = colonMatch[2].trim();
        
        return {
            lineNumber,
            severity: 'warning',
            type: 'character',
            description: `Character name "${characterName}" uses colon format. Should be on separate line in ALL CAPS.`,
            originalText: line,
            suggestedFix: `${characterName.toUpperCase()}\n${dialogue}`
        };
    }
    
    // Check for mixed-case character names that should be ALL CAPS
    // Look for pattern: Starts with capital, contains lowercase, looks like a name
    const mixedCaseMatch = line.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)$/);
    if (mixedCaseMatch && line.length < 30 && previousType === 'empty') {
        const name = mixedCaseMatch[1];
        
        return {
            lineNumber,
            severity: 'warning',
            type: 'character',
            description: `Potential character name "${name}" not in ALL CAPS.`,
            originalText: line,
            suggestedFix: name.toUpperCase()
        };
    }
    
    // Check for dash-separated dialogue (JOHN - Hello)
    const dashMatch = line.match(/^([A-Z][A-Z\s']+)\s*-\s*(.+)$/);
    if (dashMatch && line.length < 50) {
        const characterName = dashMatch[1].trim();
        const dialogue = dashMatch[2].trim();
        
        return {
            lineNumber,
            severity: 'warning',
            type: 'dialogue',
            description: `Character "${characterName}" uses dash separator. Dialogue should be on next line.`,
            originalText: line,
            suggestedFix: `${characterName}\n${dialogue}`
        };
    }
    
    return null;
}

/**
 * Detect scene heading formatting issues
 */
function detectSceneHeadingIssues(line: string, lineNumber: number): FormatIssue | null {
    // Check for lowercase scene headings
    const lowercaseSceneMatch = line.match(/^(int|ext|est|i\/e|int\.?\/ext)[\.\s]+(.+?)(?:\s+-\s+(.+))?$/i);
    if (lowercaseSceneMatch && !/^[A-Z]/.test(line)) {
        const prefix = lowercaseSceneMatch[1];
        const location = lowercaseSceneMatch[2];
        const time = lowercaseSceneMatch[3] || 'DAY';
        
        return {
            lineNumber,
            severity: 'warning',
            type: 'scene_heading',
            description: 'Scene heading not in proper format (should be uppercase).',
            originalText: line,
            suggestedFix: `${prefix.toUpperCase()}. ${location.toUpperCase()} - ${time.toUpperCase()}`
        };
    }
    
    // Check for scene heading missing time of day
    const missingTimeMatch = line.match(/^(INT|EXT|EST|I\/E|INT\.?\/EXT)[\.\s]+([^-]+)$/);
    if (missingTimeMatch && line.length > 5) {
        const prefix = missingTimeMatch[1];
        const location = missingTimeMatch[2].trim();
        
        return {
            lineNumber,
            severity: 'info',
            type: 'scene_heading',
            description: 'Scene heading missing time of day.',
            originalText: line,
            suggestedFix: `${prefix}. ${location} - DAY`
        };
    }
    
    // Check for location without INT/EXT prefix
    // Heuristic: Short line (< 40 chars), title case or all caps, no punctuation at end
    const potentialLocationMatch = line.match(/^([A-Z][A-Za-z\s']+)$/);
    if (potentialLocationMatch && line.length < 40 && line.length > 5 && !line.includes('.')) {
        return {
            lineNumber,
            severity: 'info',
            type: 'scene_heading',
            description: `"${line}" looks like a location but missing scene heading format.`,
            originalText: line,
            suggestedFix: `INT. ${line.toUpperCase()} - DAY`
        };
    }
    
    return null;
}

/**
 * Detect dialogue formatting issues
 */
function detectDialogueIssues(
    line: string, 
    lineNumber: number, 
    previousType?: FountainElementType
): FormatIssue | null {
    // Check for quoted dialogue without character name
    const quotedDialogueMatch = line.match(/^["'](.+)["']\s*(?:said|says)\s+([A-Za-z]+)$/i);
    if (quotedDialogueMatch) {
        const dialogue = quotedDialogueMatch[1];
        const character = quotedDialogueMatch[2];
        
        return {
            lineNumber,
            severity: 'warning',
            type: 'dialogue',
            description: `Quoted dialogue format detected. Should use Fountain character/dialogue format.`,
            originalText: line,
            suggestedFix: `${character.toUpperCase()}\n${dialogue}`
        };
    }
    
    return null;
}

/**
 * Detect spacing issues
 */
function detectSpacingIssues(
    lines: string[], 
    lineNumber: number, 
    currentType: FountainElementType,
    previousType?: FountainElementType
): FormatIssue | null {
    // Check if character name should have blank line before it
    if (currentType === 'character' && previousType && previousType !== 'empty') {
        return {
            lineNumber: lineNumber - 1,
            severity: 'info',
            type: 'spacing',
            description: 'Character name should be preceded by blank line.',
            originalText: lines[lineNumber - 1],
            suggestedFix: lines[lineNumber - 1] + '\n'
        };
    }
    
    // Check if scene heading should have blank line after it
    if (previousType === 'scene_heading' && currentType !== 'empty') {
        return {
            lineNumber: lineNumber - 1,
            severity: 'info',
            type: 'spacing',
            description: 'Scene heading should be followed by blank line.',
            originalText: lines[lineNumber - 1],
            suggestedFix: lines[lineNumber - 1] + '\n'
        };
    }
    
    return null;
}

/**
 * Get a summary of issues by type
 */
export function getIssueSummary(issues: FormatIssue[]): Record<string, number> {
    const summary: Record<string, number> = {
        character: 0,
        scene_heading: 0,
        dialogue: 0,
        spacing: 0,
        general: 0
    };
    
    issues.forEach(issue => {
        summary[issue.type]++;
    });
    
    return summary;
}

