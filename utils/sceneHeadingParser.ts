/**
 * Scene Heading Parser
 * 
 * Parses scene headings to detect which field the cursor is in:
 * - Type field: INT./EXT./I/E
 * - Location field: The location name
 * - Time field: DAY/NIGHT/etc.
 * 
 * Format: INT. LOCATION - TIME
 */

export type SceneHeadingField = 'type' | 'location' | 'time';

export interface SceneHeadingParts {
    type: string;      // "INT." or "EXT." or "I/E"
    location: string;  // Location name
    time: string;      // Time of day
    fullText: string;  // Complete scene heading
}

export interface SceneHeadingFieldInfo {
    field: SceneHeadingField;
    cursorInField: number; // Cursor position within the field
    fieldStart: number;    // Start position of field in line
    fieldEnd: number;      // End position of field in line
    parts: SceneHeadingParts;
}

/**
 * Parse a scene heading into its component parts
 */
export function parseSceneHeading(line: string): SceneHeadingParts {
    const trimmed = line.trim();
    
    // Match: INT./EXT./I/E [location] - [time]
    const match = trimmed.match(/^(INT\.|EXT\.|INT\/EXT\.|INT\.\/EXT\.|EST\.|I\/E\.)\s*(.+?)?\s*(?:-\s*(.+))?$/i);
    
    if (match) {
        return {
            type: match[1].toUpperCase(),
            location: match[2]?.trim() || '',
            time: match[3]?.trim() || '',
            fullText: trimmed
        };
    }
    
    // Match partial: Just INT or EXT (no period yet)
    const partialMatch = trimmed.match(/^(INT|EXT|I\/E|INT\/EXT|EST)\s*(.*)$/i);
    if (partialMatch) {
        return {
            type: partialMatch[1].toUpperCase(),
            location: partialMatch[2]?.trim() || '',
            time: '',
            fullText: trimmed
        };
    }
    
    // Default: assume it's a type field if it starts with I or E
    if (/^[IE]/i.test(trimmed)) {
        return {
            type: trimmed,
            location: '',
            time: '',
            fullText: trimmed
        };
    }
    
    return {
        type: '',
        location: '',
        time: '',
        fullText: trimmed
    };
}

/**
 * Detect which field the cursor is in within a scene heading
 */
export function detectSceneHeadingField(line: string, cursorPos: number): SceneHeadingFieldInfo {
    const parts = parseSceneHeading(line);
    const trimmed = line.trim();
    
    // Calculate positions relative to trimmed line
    const leadingWhitespace = line.length - trimmed.length;
    const relativeCursorPos = cursorPos - leadingWhitespace;
    
    // Build regex to find field boundaries
    const typePattern = /^(INT\.|EXT\.|INT\/EXT\.|INT\.\/EXT\.|EST\.|I\/E\.|INT|EXT|I\/E|INT\/EXT|EST)/i;
    const typeMatch = trimmed.match(typePattern);
    
    if (!typeMatch) {
        // Not a valid scene heading format
        return {
            field: 'type',
            cursorInField: relativeCursorPos,
            fieldStart: 0,
            fieldEnd: trimmed.length,
            parts
        };
    }
    
    const typeEnd = typeMatch[0].length;
    const afterType = trimmed.substring(typeEnd).trimStart();
    const locationStart = typeEnd + (trimmed.length - afterType.length - typeEnd);
    
    // Check if there's a dash separator (indicates time field exists)
    const dashIndex = trimmed.indexOf(' - ');
    const hasTimeField = dashIndex !== -1;
    
    if (relativeCursorPos <= typeEnd) {
        // Cursor is in type field
        return {
            field: 'type',
            cursorInField: relativeCursorPos,
            fieldStart: 0,
            fieldEnd: typeEnd,
            parts
        };
    } else if (hasTimeField && relativeCursorPos > dashIndex + 3) {
        // Cursor is in time field (after " - ")
        return {
            field: 'time',
            cursorInField: relativeCursorPos - (dashIndex + 3),
            fieldStart: dashIndex + 3,
            fieldEnd: trimmed.length,
            parts
        };
    } else {
        // Cursor is in location field
        const locStart = typeEnd + (trimmed[typeEnd] === ' ' ? 1 : 0);
        const locEnd = hasTimeField ? dashIndex : trimmed.length;
        
        return {
            field: 'location',
            cursorInField: relativeCursorPos - locStart,
            fieldStart: locStart,
            fieldEnd: locEnd,
            parts
        };
    }
}

/**
 * Get the next field in scene heading navigation order
 */
export function getNextSceneHeadingField(currentField: SceneHeadingField): SceneHeadingField {
    switch (currentField) {
        case 'type':
            return 'location';
        case 'location':
            return 'time';
        case 'time':
            return 'location'; // Wrap around or stay at time
        default:
            return 'location';
    }
}

/**
 * Get the previous field in scene heading navigation order
 */
export function getPreviousSceneHeadingField(currentField: SceneHeadingField): SceneHeadingField {
    switch (currentField) {
        case 'type':
            return 'type'; // Stay at type
        case 'location':
            return 'type';
        case 'time':
            return 'location';
        default:
            return 'type';
    }
}

/**
 * Standard time of day options for SmartType
 */
export const TIME_OF_DAY_OPTIONS = [
    'DAY',
    'NIGHT',
    'DAWN',
    'DUSK',
    'CONTINUOUS',
    'LATER',
    'MOMENTS LATER',
    'EARLY MORNING',
    'LATE AFTERNOON',
    'EVENING',
    'MIDNIGHT',
    'SUNRISE',
    'SUNSET'
] as const;

export type TimeOfDay = typeof TIME_OF_DAY_OPTIONS[number];

/**
 * Format scene heading type according to industry standards
 * - INT → INT.
 * - EXT → EXT.
 * - INT/EXT → INT./EXT.
 * - I/E → I./E.
 * - EST → EST.
 * 
 * Handles mixed case inputs like "int/ext" → "INT./EXT."
 */
export function formatSceneHeadingType(type: string): string {
    // Normalize input - handle mixed case like "int/ext" or "I/E"
    const normalized = type.trim();
    const upper = normalized.toUpperCase();
    
    // Handle INT/EXT variations (industry standard: INT./EXT.)
    // Match: "int/ext", "INT/EXT", "int/EXT", "INT/ext", "INT./EXT", "INT/EXT."
    if (upper.includes('INT/EXT') || upper.includes('INT./EXT') || upper.includes('INT/EXT.')) {
        // Normalize to INT./EXT. (periods after each abbreviation)
        return 'INT./EXT.';
    }
    
    // Handle I/E variations (industry standard: I./E.)
    // Match: "i/e", "I/E", "I/e", "i/E", "I./E", "I/E."
    if (upper.includes('I/E') || upper.includes('I./E') || upper.includes('I/E.')) {
        // Normalize to I./E. (periods after each abbreviation)
        return 'I./E.';
    }
    
    // Handle simple types (INT, EXT, EST)
    // Must check for INT/EXT first, so check that it doesn't include "/"
    if (upper.startsWith('INT') && !upper.includes('/')) {
        return 'INT.';
    }
    if (upper.startsWith('EXT') && !upper.includes('/')) {
        return 'EXT.';
    }
    if (upper.startsWith('EST')) {
        return 'EST.';
    }
    
    // Default: add period if missing, but preserve structure
    return upper.endsWith('.') ? upper : upper + '.';
}

/**
 * Build a complete scene heading string from parts
 * Formats type according to industry standards and assembles: TYPE LOCATION - TIME
 */
export function buildSceneHeading(parts: SceneHeadingParts): string {
    const formattedType = formatSceneHeadingType(parts.type);
    let heading = formattedType;
    
    if (parts.location && parts.location.trim()) {
        heading += ' ' + parts.location.trim();
    }
    
    if (parts.time && parts.time.trim()) {
        heading += ' - ' + parts.time.trim();
    }
    
    return heading;
}

/**
 * Update scene heading parts with new values
 * Useful for incrementally building scene headings
 */
export function updateSceneHeadingParts(
    currentParts: SceneHeadingParts,
    updates: Partial<Pick<SceneHeadingParts, 'type' | 'location' | 'time'>>
): SceneHeadingParts {
    return {
        type: updates.type !== undefined ? updates.type : currentParts.type,
        location: updates.location !== undefined ? updates.location : currentParts.location,
        time: updates.time !== undefined ? updates.time : currentParts.time,
        fullText: '' // Will be rebuilt when needed
    };
}

