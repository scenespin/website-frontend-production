/**
 * Fountain Formatting Utilities
 * 
 * Provides parsing, formatting, and auto-transition logic for Fountain screenplay format.
 * Reference: https://fountain.io/syntax
 */

export type FountainElementType =
    | 'scene_heading'      // INT. or EXT. or EST. or INT./EXT. or I/E
    | 'action'             // Plain text (default)
    | 'character'          // ALL CAPS followed by dialogue
    | 'dialogue'           // Text after character name
    | 'parenthetical'      // (text in parentheses)
    | 'transition'         // FADE IN:, CUT TO:, etc.
    | 'centered'           // > text <
    | 'page_break'         // ===
    | 'section'            // # Section
    | 'synopsis'           // = Synopsis
    | 'note'               // [[ note ]]
    | 'lyrics'             // ~ lyrics ~
    | 'title_page'         // Key: Value
    | 'empty';             // Empty line

export interface FountainElement {
    type: FountainElementType;
    text: string;
    lineNumber: number;
}

/**
 * Detects the Fountain element type from a line of text
 */
export function detectElementType(line: string, previousType?: FountainElementType): FountainElementType {
    const trimmed = line.trim();
    
    // Empty line
    if (!trimmed) {
        return 'empty';
    }
    
    // Scene heading (INT., EXT., EST., INT./EXT., I/E)
    if (/^(INT|EXT|EST|INT\.?\/EXT|I\/E)[\.\s]/i.test(trimmed)) {
        return 'scene_heading';
    }
    
    // Transition (ALL CAPS ending with TO:)
    if (/^[A-Z\s]+TO:$/.test(trimmed)) {
        return 'transition';
    }
    
    // Centered text (> text <)
    if (/^>.*<$/.test(trimmed)) {
        return 'centered';
    }
    
    // Page break (===)
    if (trimmed === '===') {
        return 'page_break';
    }
    
    // Section heading (# Section)
    if (/^#+\s/.test(trimmed)) {
        return 'section';
    }
    
    // Synopsis (= Synopsis)
    if (/^=\s/.test(trimmed)) {
        return 'synopsis';
    }
    
    // Note ([[ note ]])
    if (/^\[\[.*\]\]$/.test(trimmed)) {
        return 'note';
    }
    
    // Lyrics (~ lyrics ~)
    if (/^~.*~$/.test(trimmed)) {
        return 'lyrics';
    }
    
    // Parenthetical ((text))
    if (/^\(.*\)$/.test(trimmed)) {
        return 'parenthetical';
    }
    
    // Character name (ALL CAPS, optionally with ^ or # for numbered characters)
    // Must be preceded by empty line or dialogue
    // Note: # is valid for numbered characters like "REPORTER #1", "COP #2"
    if (/^[A-Z\s'0-9#]+(\^)?$/.test(trimmed) && trimmed.length < 40) {
        if (!previousType || previousType === 'empty' || previousType === 'dialogue' || previousType === 'parenthetical') {
            // Exclude common transitions and screenplay elements
            if (/^(THE END|END|FADE OUT|FADE IN|FADE TO BLACK|BLACK|CUT TO|DISSOLVE TO|CONTINUED|MORE|CONT'D)\.?$/i.test(trimmed)) {
                return 'transition';
            }
            // Exclude narrative section headings that look like characters
            if (/^(THE .* GOES LIVE|THE .* BEGINS|THE .* ENDS)$/i.test(trimmed)) {
                return 'action';
            }
            return 'character';
        }
    }
    
    // Dialogue (follows character or parenthetical)
    if (previousType === 'character' || previousType === 'parenthetical' || previousType === 'dialogue') {
        if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
            return 'parenthetical';
        }
        return 'dialogue';
    }
    
    // Default to action
    return 'action';
}

/**
 * Auto-transition logic for pressing Enter or Tab
 * Returns the next expected element type based on current type
 */
export function getNextElementType(currentType: FountainElementType): FountainElementType {
    switch (currentType) {
        case 'scene_heading':
            return 'action';
        
        case 'action':
            return 'action'; // Stay in action, user can manually switch
        
        case 'character':
            return 'dialogue';
        
        case 'dialogue':
            return 'action'; // After dialogue, return to action
        
        case 'parenthetical':
            return 'dialogue';
        
        case 'transition':
            return 'scene_heading';
        
        default:
            return 'action';
    }
}

/**
 * Formats text according to its element type
 * Returns the formatted text with proper capitalization and spacing
 */
export function formatElement(text: string, type: FountainElementType): string {
    const trimmed = text.trim();
    
    switch (type) {
        case 'scene_heading':
            // Scene headings should be ALL CAPS
            return trimmed.toUpperCase();
        
        case 'character':
            // Character names should be ALL CAPS and centered
            return trimmed.toUpperCase();
        
        case 'transition':
            // Transitions should be ALL CAPS and right-aligned
            return trimmed.toUpperCase();
        
        case 'parenthetical':
            // Ensure parentheses are present
            if (!trimmed.startsWith('(')) {
                return `(${trimmed})`;
            }
            return trimmed;
        
        case 'centered':
            // Ensure > < markers
            if (!trimmed.startsWith('>')) {
                return `> ${trimmed} <`;
            }
            return trimmed;
        
        case 'lyrics':
            // Ensure ~ ~ markers
            if (!trimmed.startsWith('~')) {
                return `~ ${trimmed} ~`;
            }
            return trimmed;
        
        case 'section':
            // Ensure # prefix
            if (!trimmed.startsWith('#')) {
                return `# ${trimmed}`;
            }
            return trimmed;
        
        case 'synopsis':
            // Ensure = prefix
            if (!trimmed.startsWith('=')) {
                return `= ${trimmed}`;
            }
            return trimmed;
        
        case 'note':
            // Ensure [[ ]] markers
            if (!trimmed.startsWith('[[')) {
                return `[[ ${trimmed} ]]`;
            }
            return trimmed;
        
        default:
            return trimmed;
    }
}

/**
 * Parses a full Fountain document into elements
 */
export function parseFountainDocument(text: string): FountainElement[] {
    const lines = text.split('\n');
    const elements: FountainElement[] = [];
    let previousType: FountainElementType | undefined;
    
    lines.forEach((line, index) => {
        const type = detectElementType(line, previousType);
        elements.push({
            type,
            text: line,
            lineNumber: index + 1
        });
        previousType = type;
    });
    
    return elements;
}

/**
 * Validates if a scene heading is properly formatted
 */
export function isValidSceneHeading(text: string): boolean {
    const trimmed = text.trim();
    return /^(INT|EXT|EST|INT\.?\/EXT|I\/E)[\.\s]/i.test(trimmed);
}

/**
 * Validates if a character name is properly formatted
 */
export function isValidCharacterName(text: string): boolean {
    const trimmed = text.trim();
    // Should be ALL CAPS, less than 40 characters, no lowercase letters
    return /^[A-Z\s]+(\^)?$/.test(trimmed) && trimmed.length < 40;
}

/**
 * Helper to convert scene heading abbreviations
 */
export function expandSceneHeading(text: string): string {
    const trimmed = text.trim().toUpperCase();
    
    if (trimmed.startsWith('INT')) {
        return trimmed.replace(/^INT[\.\s]/, 'INT. ');
    }
    
    if (trimmed.startsWith('EXT')) {
        return trimmed.replace(/^EXT[\.\s]/, 'EXT. ');
    }
    
    return trimmed;
}

/**
 * Exports fountain elements back to plain text
 */
export function exportToFountain(elements: FountainElement[]): string {
    return elements.map(el => el.text).join('\n');
}

/**
 * Finds the current scene heading (location) from a cursor position in the content.
 * Searches backwards from the cursor position to find the most recent scene heading.
 * Returns null if no scene heading is found before the cursor.
 */
export function getCurrentSceneHeading(content: string, cursorPosition: number): string | null {
    const textBeforeCursor = content.substring(0, cursorPosition);
    const lines = textBeforeCursor.split('\n');
    
    // Search backwards from cursor to find the most recent scene heading
    for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i].trim();
        if (isValidSceneHeading(line)) {
            return line;
        }
    }
    
    return null;
}

/**
 * Finds all characters in the current scene (between the scene heading and cursor position).
 * Returns an array of unique character names found in the current scene.
 */
export function getCurrentSceneCharacters(content: string, cursorPosition: number): string[] {
    const textBeforeCursor = content.substring(0, cursorPosition);
    const lines = textBeforeCursor.split('\n');
    
    // Find the start of the current scene
    let sceneStartIndex = -1;
    for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i].trim();
        if (isValidSceneHeading(line)) {
            sceneStartIndex = i;
            break;
        }
    }
    
    // If no scene heading found, return empty array
    if (sceneStartIndex === -1) {
        return [];
    }
    
    // Extract all character names from the current scene
    const characters = new Set<string>();
    let previousType: FountainElementType | undefined;
    
    for (let i = sceneStartIndex + 1; i < lines.length; i++) {
        const line = lines[i];
        const elementType = detectElementType(line, previousType);
        
        if (elementType === 'character') {
            const characterName = line.trim()
                .replace(/\^$/, '') // Remove dual dialogue marker
                .replace(/\(.*\)$/, '') // Remove parenthetical extensions like (V.O.) or (O.S.)
                .trim();
            
            if (characterName) {
                characters.add(characterName);
            }
        }
        
        previousType = elementType;
    }
    
    return Array.from(characters);
}

/**
 * Gets the full scene context (heading + characters) for AI prompts.
 * Returns an object with scene heading and character list.
 */
export function getCurrentSceneContext(content: string, cursorPosition: number): {
    sceneHeading: string | null;
    characters: string[];
    storyBeats: string[];
} {
    return {
        sceneHeading: getCurrentSceneHeading(content, cursorPosition),
        characters: getCurrentSceneCharacters(content, cursorPosition),
        storyBeats: getCurrentSceneStoryBeats(content, cursorPosition)
    };
}

/**
 * Extracts story beats (key action lines) from the current scene.
 * Returns an array of significant action lines that represent story progression.
 */
export function getCurrentSceneStoryBeats(content: string, cursorPosition: number): string[] {
    const textBeforeCursor = content.substring(0, cursorPosition);
    const lines = textBeforeCursor.split('\n');
    
    // Find the start of the current scene
    let sceneStartIndex = -1;
    for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i].trim();
        if (isValidSceneHeading(line)) {
            sceneStartIndex = i;
            break;
        }
    }
    
    // If no scene heading found, return empty array
    if (sceneStartIndex === -1) {
        return [];
    }
    
    // Extract action lines (story beats) from the current scene
    const storyBeats: string[] = [];
    let previousType: FountainElementType | undefined;
    
    for (let i = sceneStartIndex + 1; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        const elementType = detectElementType(line, previousType);
        
        // Collect action lines (these are the story beats)
        // Filter out very short lines and tags
        if (elementType === 'action' && trimmed.length > 10 && !isFountainTag(line)) {
            storyBeats.push(trimmed);
        }
        
        previousType = elementType;
    }
    
    return storyBeats;
}

/**
 * Gets CSS class name for element type (for styling)
 */
export function getElementClassName(type: FountainElementType): string {
    switch (type) {
        case 'scene_heading':
            return 'fountain-scene-heading';
        case 'action':
            return 'fountain-action';
        case 'character':
            return 'fountain-character';
        case 'dialogue':
            return 'fountain-dialogue';
        case 'parenthetical':
            return 'fountain-parenthetical';
        case 'transition':
            return 'fountain-transition';
        case 'centered':
            return 'fountain-centered';
        default:
            return 'fountain-default';
    }
}

/**
 * Checks if a line is a Fountain tag (should be hidden from display)
 * Tags: @location:, @characters:, @character:, @scene:
 */
export function isFountainTag(line: string): boolean {
    const trimmed = line.trim();
    return /^@(location|characters?|scene):/i.test(trimmed);
}

/**
 * Removes Fountain tags from content for clean visual display
 * Tags are kept in the file but stripped from the editor view
 * 
 * @param content Fountain content with tags
 * @returns Content without visible tags
 */
export function stripTagsForDisplay(content: string): string {
    return content
        .split('\n')
        .filter(line => !isFountainTag(line))
        .join('\n');
}

/**
 * Counts lines that aren't tags (for accurate line number display)
 */
export function getVisibleLineNumber(content: string, position: number): number {
    const textBeforeCursor = content.substring(0, position);
    const lines = textBeforeCursor.split('\n');
    
    // Count only non-tag lines
    let visibleLineCount = 0;
    for (const line of lines) {
        if (!isFountainTag(line)) {
            visibleLineCount++;
        }
    }
    
    return visibleLineCount;
}

/**
 * Counts pages (approximate - 1 page = ~55 lines of formatted screenplay)
 */
export function estimatePageCount(text: string): number {
    const lines = text.split('\n').length;
    return Math.ceil(lines / 55);
}

/**
 * Counts words in the document
 */
export function countWords(text: string): number {
    return text.split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Gets character count (with and without spaces)
 */
export function getCharacterCount(text: string): { withSpaces: number; withoutSpaces: number } {
    return {
        withSpaces: text.length,
        withoutSpaces: text.replace(/\s/g, '').length
    };
}

/**
 * Detects the current scene and estimates the act from cursor position.
 * Returns scene heading and estimated act number (1, 2, or 3).
 * Uses heuristic: 0-33% = Act 1, 34-66% = Act 2, 67-100% = Act 3
 */
export function detectSceneFromCursor(
    content: string, 
    cursorPosition: number
): { sceneHeading: string; act: number } | null {
    // Get current scene heading
    const sceneHeading = getCurrentSceneHeading(content, cursorPosition);
    
    if (!sceneHeading) {
        return null;
    }
    
    // Count all scene headings in the document
    const allLines = content.split('\n');
    const allSceneHeadings: number[] = [];
    
    allLines.forEach((line, index) => {
        if (isValidSceneHeading(line.trim())) {
            allSceneHeadings.push(index);
        }
    });
    
    // Find which scene number we're currently in
    const textBeforeCursor = content.substring(0, cursorPosition);
    const linesBeforeCursor = textBeforeCursor.split('\n');
    
    let currentSceneIndex = -1;
    for (let i = linesBeforeCursor.length - 1; i >= 0; i--) {
        const line = linesBeforeCursor[i].trim();
        if (isValidSceneHeading(line)) {
            // Find this scene's position in all scenes
            currentSceneIndex = allSceneHeadings.indexOf(i);
            break;
        }
    }
    
    if (currentSceneIndex === -1 || allSceneHeadings.length === 0) {
        // Default to Act 1 if we can't determine
        return { sceneHeading, act: 1 };
    }
    
    // Calculate percentage through screenplay
    const percentageThrough = currentSceneIndex / allSceneHeadings.length;
    
    // Estimate act based on position
    // Act 1: 0-33%, Act 2: 34-66%, Act 3: 67-100%
    let act: number;
    if (percentageThrough < 0.33) {
        act = 1;
    } else if (percentageThrough < 0.67) {
        act = 2;
    } else {
        act = 3;
    }
    
    return { sceneHeading, act };
}

