/**
 * Fountain Format Corrector
 * 
 * Automatically fixes common formatting issues in screenplay content.
 */

import { detectElementType, FountainElementType } from './fountain';
import { FormatIssue } from './fountainValidator';

export interface CorrectionResult {
    correctedContent: string;
    appliedFixes: FormatIssue[];
    changeCount: number;
}

/**
 * Apply automatic fixes to Fountain content based on detected issues
 */
export function correctFountainContent(
    content: string, 
    issues: FormatIssue[]
): CorrectionResult {
    const lines = content.split('\n');
    const appliedFixes: FormatIssue[] = [];
    let changeCount = 0;
    
    // Sort issues by line number in descending order (fix from bottom up to preserve line numbers)
    const sortedIssues = [...issues]
        .filter(issue => issue.suggestedFix !== undefined)
        .sort((a, b) => b.lineNumber - a.lineNumber);
    
    // Apply fixes
    for (const issue of sortedIssues) {
        const fix = issue.suggestedFix;
        if (!fix) continue;
        
        // Handle multi-line fixes (e.g., splitting "JOHN: Hello" into two lines)
        if (fix.includes('\n')) {
            const fixLines = fix.split('\n');
            lines.splice(issue.lineNumber, 1, ...fixLines);
            appliedFixes.push(issue);
            changeCount++;
        } else {
            // Single line replacement
            if (lines[issue.lineNumber] !== undefined) {
                lines[issue.lineNumber] = fix;
                appliedFixes.push(issue);
                changeCount++;
            }
        }
    }
    
    // Additional intelligent corrections
    const correctedLines = applyIntelligentCorrections(lines);
    
    return {
        correctedContent: correctedLines.join('\n'),
        appliedFixes,
        changeCount
    };
}

/**
 * Apply intelligent corrections that don't require explicit issue detection
 */
function applyIntelligentCorrections(lines: string[]): string[] {
    const corrected: string[] = [];
    let previousType: FountainElementType | undefined;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        const elementType = detectElementType(line, previousType);
        
        // If empty line, keep it
        if (!trimmed) {
            corrected.push(line);
            previousType = elementType;
            continue;
        }
        
        // Ensure blank line after scene headings
        if (elementType === 'scene_heading') {
            corrected.push(trimmed); // Scene headings should be trimmed
            
            // Check if next line is not empty and not another scene heading
            const nextLine = lines[i + 1];
            if (nextLine !== undefined && nextLine.trim() && 
                detectElementType(nextLine, elementType) !== 'scene_heading') {
                corrected.push(''); // Add blank line
            }
        }
        // Ensure blank line before character names (unless after empty or scene heading)
        else if (elementType === 'character') {
            if (previousType && previousType !== 'empty' && previousType !== 'scene_heading') {
                corrected.push(''); // Add blank line before character
            }
            corrected.push(trimmed);
        }
        // Regular lines
        else {
            corrected.push(line);
        }
        
        previousType = elementType;
    }
    
    return corrected;
}

/**
 * Auto-correct specific common patterns without full validation
 * This is a lighter-weight option for quick fixes
 */
export function quickCorrect(content: string): string {
    let corrected = content;
    
    // Normalize scene headings to uppercase and add periods after INT/EXT
    corrected = corrected.replace(
        /^(int|ext|est|i\/e)([\.\s]+)([^\n]+)$/gim,
        (match, prefix, separator, rest) => {
            // Uppercase the prefix and the entire rest (location + time)
            return `${prefix.toUpperCase()}. ${rest.toUpperCase()}`;
        }
    );
    
    // Ensure scene headings have time of day if missing
    corrected = corrected.replace(
        /^(INT|EXT|EST|I\/E)[\.\s]+([^-\n]+)$/gim,
        (match, prefix, location) => {
            // Check if it already has a dash (time of day)
            if (match.includes('-')) return match;
            return `${prefix}. ${location.trim()} - DAY`;
        }
    );
    
    return corrected;
}

/**
 * Convert mixed-case character names to ALL CAPS in dialogue
 */
export function normalizeCharacterNames(content: string): string {
    const lines = content.split('\n');
    const characterNames = new Set<string>();
    let previousType: FountainElementType | undefined;
    
    // First pass: collect all character names
    for (const line of lines) {
        const trimmed = line.trim();
        const elementType = detectElementType(line, previousType);
        
        if (elementType === 'character') {
            const charName = trimmed.replace(/\^$/, '').replace(/\(.*\)$/, '').trim();
            characterNames.add(charName.toUpperCase());
        }
        
        previousType = elementType;
    }
    
    // Second pass: normalize mixed-case names that match known characters
    const normalized = lines.map((line, index) => {
        const trimmed = line.trim();
        const elementType = detectElementType(line, 
            index > 0 ? detectElementType(lines[index - 1], undefined) : undefined
        );
        
        // Check if this looks like a character name but mixed case
        if (trimmed.length < 40 && trimmed.length > 2) {
            const upperVersion = trimmed.toUpperCase();
            if (characterNames.has(upperVersion) && trimmed !== upperVersion) {
                // This is a character name in wrong case
                return upperVersion;
            }
        }
        
        return line;
    });
    
    return normalized.join('\n');
}

/**
 * Smart formatting that preserves intentional styling
 * while fixing obvious errors
 */
export function smartFormat(content: string): string {
    // Step 1: Quick corrections for common patterns
    let formatted = quickCorrect(content);
    
    // Step 2: Normalize character names
    formatted = normalizeCharacterNames(formatted);
    
    // Step 3: Ensure proper spacing
    formatted = ensureProperSpacing(formatted);
    
    return formatted;
}

/**
 * Ensure proper spacing between elements
 */
function ensureProperSpacing(content: string): string {
    const lines = content.split('\n');
    const spaced: string[] = [];
    let previousType: FountainElementType | undefined;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        
        if (!trimmed) {
            // Keep existing empty lines (don't duplicate)
            if (spaced.length > 0 && spaced[spaced.length - 1] !== '') {
                spaced.push('');
            }
            previousType = 'empty';
            continue;
        }
        
        const elementType = detectElementType(line, previousType);
        
        // Add blank line before character names (unless after scene heading or already blank)
        if (elementType === 'character' && previousType && 
            previousType !== 'empty' && previousType !== 'scene_heading') {
            spaced.push('');
        }
        
        spaced.push(trimmed);
        
        // Add blank line after scene headings
        if (elementType === 'scene_heading') {
            const nextLine = lines[i + 1];
            if (nextLine && nextLine.trim()) {
                spaced.push('');
            }
        }
        
        previousType = elementType;
    }
    
    return spaced.join('\n');
}

