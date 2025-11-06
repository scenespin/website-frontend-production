/**
 * Fountain Auto-Import Utility
 * 
 * Automatically extracts locations and characters from pasted Fountain content
 * and creates them in the screenplay context.
 */

import { detectElementType, FountainElementType } from './fountain';

export interface AutoImportResult {
    locations: Set<string>;
    characters: Set<string>;
    characterDescriptions: Map<string, string>; // NEW: Map character name to description
    scenes: Array<{
        heading: string;
        location: string;
        characters: string[];
        startLine: number;
        endLine: number;
    }>;
}

/**
 * Parse Fountain content and extract all locations and characters
 * @param content - Fountain screenplay text
 * @returns Object containing unique locations, characters, and scene breakdown
 */
export function parseContentForImport(content: string): AutoImportResult {
    const lines = content.split('\n');
    const locations = new Set<string>();
    const characters = new Set<string>();
    const characterDescriptions = new Map<string, string>();
    const scenes: AutoImportResult['scenes'] = [];
    
    let currentScene: AutoImportResult['scenes'][0] | null = null;
    let previousType: FountainElementType | undefined;
    let currentCharacterForDescription: string | null = null; // Track @CHARACTER for multi-line descriptions
    
    console.log('[AutoImport] Parsing', lines.length, 'lines...');
    console.log('[AutoImport] First 5 lines:', lines.slice(0, 5));
    
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex];
        const trimmed = line.trim();
        const elementType = detectElementType(line, previousType);
        
        // Debug: Log every non-empty line with its detected type
        if (trimmed.length > 0) {
            console.log(`[AutoImport] Line ${lineIndex} [${elementType}]: "${trimmed}"`);
        }
        
        // NEW: Detect @CHARACTER notation for character descriptions
        if (trimmed.startsWith('@')) {
            const characterName = trimmed.substring(1).trim().toUpperCase();
            if (characterName && characterName.length > 0 && characterName.length < 40) {
                currentCharacterForDescription = characterName;
                characters.add(characterName);
                characterDescriptions.set(characterName, ''); // Initialize empty description
                console.log('[AutoImport] Character with description marker:', characterName);
            }
            previousType = elementType;
            continue;
        }
        
        // NEW: If we're collecting a character description, append this line to it
        if (currentCharacterForDescription && trimmed.length > 0 && !elementType.includes('heading')) {
            const existingDesc = characterDescriptions.get(currentCharacterForDescription) || '';
            const newDesc = existingDesc + (existingDesc ? ' ' : '') + trimmed;
            characterDescriptions.set(currentCharacterForDescription, newDesc);
            console.log('[AutoImport] Adding description to', currentCharacterForDescription, ':', trimmed);
            
            // Stop collecting description if we hit a blank line or new section
            if (trimmed.length === 0 || trimmed.startsWith('=') || elementType === 'scene_heading') {
                currentCharacterForDescription = null;
            }
            previousType = elementType;
            continue;
        }
        
        // Reset character description collection on blank line or new section
        if (currentCharacterForDescription && (trimmed.length === 0 || trimmed.startsWith('=') || elementType === 'scene_heading')) {
            currentCharacterForDescription = null;
        }
        
        // Debug log for character detection
        if (elementType === 'character') {
            console.log('[AutoImport] Character detected (strict) at line', lineIndex, ':', trimmed, '(previousType:', previousType, ')');
        }
        
        // Detect scene heading and extract location
        if (elementType === 'scene_heading') {
            // Save previous scene if exists (set its end line)
            if (currentScene) {
                currentScene.endLine = lineIndex - 1;
                scenes.push(currentScene);
            }
            
            // Extract location from scene heading
            // Format: INT. LOCATION - TIME or EXT. LOCATION - TIME
            const locationMatch = trimmed.match(/^(?:INT|EXT|EST|INT\.?\/EXT|I\/E)[\.\s]+(.+?)\s*-\s*(.+)$/i);
            const location = locationMatch ? locationMatch[1].trim() : trimmed;
            
            locations.add(location);
            
            console.log('[AutoImport] Scene detected:', trimmed, '-> Location:', location);
            
            // Start new scene
            currentScene = {
                heading: trimmed,
                location: location,
                characters: [],
                startLine: lineIndex,
                endLine: lineIndex // Will be updated when next scene starts or at end
            };
        }
        
        // Detect character names - use both strict Fountain detection AND lenient ALL CAPS detection
        let isCharacter = elementType === 'character';
        
        // LENIENT MODE 1: Detect colon-separated dialogue (john: hello, JOHN: hello)
        const colonMatch = trimmed.match(/^([A-Za-z][A-Za-z\s']+?):\s*(.+)$/);
        if (!isCharacter && colonMatch && currentScene) {
            const potentialCharName = colonMatch[1].trim();
            // Only if it looks like a name (not too long, doesn't contain weird chars)
            if (potentialCharName.length < 30 && !/[.!?;]/.test(potentialCharName)) {
                isCharacter = true;
                console.log('[AutoImport] Character detected (colon format) at line', lineIndex, ':', potentialCharName);
            }
        }
        
        // LENIENT MODE 2: Also detect ALL CAPS lines within scenes as potential character names
        // This helps with auto-import when content isn't perfectly formatted
        if (!isCharacter && currentScene && trimmed.length > 0 && trimmed.length < 40) {
            // Check if line is ALL CAPS (allowing spaces, apostrophes, numbers)
            const isAllCaps = /^[A-Z][A-Z\s'0-9]*$/.test(trimmed);
            // Check if it's not a scene heading or transition
            const isNotSceneHeading = !/^(INT|EXT|EST|INT\.?\/EXT|I\/E)[\.\s]/i.test(trimmed);
            const isNotTransition = !/TO:$/.test(trimmed);
            
            // CRITICAL: Exclude centered text (starts with >) and common screenplay elements
            const isNotCentered = !trimmed.startsWith('>');
            const isNotEnd = !/^(THE END|END|FADE OUT|FADE IN|FADE TO BLACK|BLACK|CUT TO|DISSOLVE TO)\.?$/i.test(trimmed);
            const isNotTitle = !/^(ACT|SCENE|CHAPTER|PART|TITLE|INTERLUDE|MONTAGE|SERIES OF SHOTS)/i.test(trimmed);
            
            // Must look like an actual name (2-4 words max, not a full sentence)
            const wordCount = trimmed.split(/\s+/).length;
            const seemsLikeName = wordCount >= 1 && wordCount <= 4;
            
            if (isAllCaps && isNotSceneHeading && isNotTransition && isNotCentered && isNotEnd && isNotTitle && seemsLikeName) {
                isCharacter = true;
                console.log('[AutoImport] Character detected (lenient mode) at line', lineIndex, ':', trimmed);
            }
        }
        
        if (isCharacter && currentScene) {
            // Extract character name (remove dual dialogue marker ^ and extensions like (V.O.))
            // Also handle colon format (john: hello -> john)
            let characterName = trimmed;
            
            // If colon format, extract just the name part
            const colonMatch2 = characterName.match(/^([A-Za-z][A-Za-z\s']+?):\s*.+$/);
            if (colonMatch2) {
                characterName = colonMatch2[1].trim();
            }
            
            // Clean up character name
            characterName = characterName
                .replace(/\^$/, '')
                .replace(/\(.*\)$/, '')
                .trim();
            
            if (characterName && characterName.length > 0) {
                console.log('[AutoImport] Adding character:', characterName);
                characters.add(characterName);
                if (!currentScene.characters.includes(characterName)) {
                    currentScene.characters.push(characterName);
                }
            }
        }
        
        previousType = elementType;
    }
    
    // Save last scene (set end to last line)
    if (currentScene) {
        currentScene.endLine = lines.length - 1;
        scenes.push(currentScene);
    }
    
    console.log('[AutoImport] Parse complete:', {
        characters: Array.from(characters),
        locations: Array.from(locations),
        scenes: scenes.length
    });
    
    return {
        locations,
        characters,
        characterDescriptions,
        scenes
    };
}

/**
 * Detect if pasted content is substantial enough to trigger auto-import
 * @param content - Text content
 * @returns True if content appears to be a screenplay
 */
export function shouldAutoImport(content: string): boolean {
    // Check if content has scene headings (likely a screenplay)
    const sceneHeadings = content.match(/^(INT|EXT|EST|INT\.?\/EXT|I\/E)[\.\s]/gim);
    
    // Auto-import if: Has 1+ scenes
    // Any Fountain content with scene headings gets auto-imported
    if (sceneHeadings) {
        const sceneCount = sceneHeadings.length;
        return sceneCount >= 1;
    }
    
    return false;
}

/**
 * Format location name for consistency
 * @param location - Raw location string
 * @returns Formatted location name
 */
export function formatLocationName(location: string): string {
    // Remove common suffixes and normalize
    return location
        .replace(/\s*-\s*(DAY|NIGHT|MORNING|AFTERNOON|EVENING|DAWN|DUSK|CONTINUOUS|LATER|SAME TIME)$/i, '')
        .trim()
        .toUpperCase();
}

/**
 * Format character name for consistency
 * @param character - Raw character string
 * @returns Formatted character name
 */
export function formatCharacterName(character: string): string {
    // Convert to title case for display
    return character
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

