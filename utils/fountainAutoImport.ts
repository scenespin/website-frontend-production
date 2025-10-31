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
    const scenes: AutoImportResult['scenes'] = [];
    
    let currentScene: AutoImportResult['scenes'][0] | null = null;
    let previousType: FountainElementType | undefined;
    
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
            
            if (isAllCaps && isNotSceneHeading && isNotTransition) {
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

