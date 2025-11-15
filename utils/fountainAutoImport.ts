/**
 * Fountain Auto-Import Utility
 * 
 * Automatically extracts locations and characters from pasted Fountain content
 * and creates them in the screenplay context.
 */

import { detectElementType, FountainElementType } from './fountain';

export interface QuestionableItem {
    type: 'character' | 'location' | 'scene_heading';
    text: string;
    lineNumber: number;
    reason: string;
    suggestion?: string;
}

export interface AutoImportResult {
    // Items that clearly match Fountain spec - auto-import these
    locations: Set<string>;
    characters: Set<string>;
    characterDescriptions: Map<string, string>;
    locationTypes: Map<string, 'INT' | 'EXT' | 'INT/EXT'>; // 🔥 NEW: Track location types from scene headings
    scenes: Array<{
        heading: string;
        location: string;
        locationType: 'INT' | 'EXT' | 'INT/EXT'; // 🔥 NEW: Store type for each scene
        characters: string[];
        startLine: number;
        endLine: number;
    }>;
    
    // Items that don't match spec - show in review modal
    questionableItems: QuestionableItem[];
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
    const locationTypes = new Map<string, 'INT' | 'EXT' | 'INT/EXT'>(); // 🔥 NEW: Track location types
    const scenes: AutoImportResult['scenes'] = [];
    const questionableItems: QuestionableItem[] = [];
    
    let currentScene: AutoImportResult['scenes'][0] | null = null;
    let previousType: FountainElementType | undefined;
    let currentCharacterForDescription: string | null = null;
    
    console.log('[AutoImport] Parsing', lines.length, 'lines...');
    
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex];
        const trimmed = line.trim();
        
        // Skip empty lines
        if (!trimmed) {
            previousType = 'empty';
            continue;
        }
        
        const elementType = detectElementType(line, previousType);
        
        // Skip title page elements
        if (trimmed.match(/^(Title|Credit|Author|Source|Draft date|Contact|Copyright):/i)) {
            previousType = elementType;
            continue;
        }
        
        // Skip section headings (= Characters =)
        if (trimmed.startsWith('=') && trimmed.endsWith('=')) {
            previousType = elementType;
            continue;
        }
        
        // Handle @CHARACTER notation (Fountain forced character with description)
        if (trimmed.startsWith('@')) {
            const characterName = trimmed.substring(1).trim().toUpperCase();
            if (characterName && characterName.length > 0 && characterName.length < 40) {
                currentCharacterForDescription = characterName;
                characters.add(characterName);
                characterDescriptions.set(characterName, '');
                console.log('[AutoImport] ✓ Character (forced):', characterName);
            }
            previousType = elementType;
            continue;
        }
        
        // Collect character description lines
        if (currentCharacterForDescription && !elementType.includes('heading')) {
            const existingDesc = characterDescriptions.get(currentCharacterForDescription) || '';
            const newDesc = existingDesc + (existingDesc ? ' ' : '') + trimmed;
            characterDescriptions.set(currentCharacterForDescription, newDesc);
            previousType = elementType;
            continue;
        }
        
        // Reset description collection
        if (currentCharacterForDescription && (elementType === 'scene_heading' || elementType === 'empty')) {
            currentCharacterForDescription = null;
        }
        
        // STRICT: Scene heading must match proper format
        if (elementType === 'scene_heading') {
            if (currentScene) {
                currentScene.endLine = lineIndex - 1;
                scenes.push(currentScene);
            }
            
            // 🔥 ENHANCED: Capture location type (INT/EXT/INT-EXT)
            const locationMatch = trimmed.match(/^(INT|EXT|EST|INT\.?\/EXT|I\/E)[\.\s]+(.+?)\s*-\s*(.+)$/i);
            if (locationMatch) {
                const typePrefix = locationMatch[1].trim().toUpperCase();
                const location = locationMatch[2].trim();
                
                // Normalize type to standard values
                let locationType: 'INT' | 'EXT' | 'INT/EXT';
                if (typePrefix === 'INT' || typePrefix === 'INT.') {
                    locationType = 'INT';
                } else if (typePrefix === 'EXT' || typePrefix === 'EXT.') {
                    locationType = 'EXT';
                } else if (typePrefix === 'INT/EXT' || typePrefix === 'INT./EXT' || typePrefix === 'I/E') {
                    locationType = 'INT/EXT';
                } else {
                    locationType = 'INT'; // Default fallback
                }
                
                locations.add(location);
                locationTypes.set(location, locationType); // 🔥 Store the type
                console.log('[AutoImport] ✓ Scene:', locationType, location);
            
                currentScene = {
                    heading: trimmed,
                    location: location,
                    locationType: locationType, // 🔥 NEW: Include type in scene data
                    characters: [],
                    startLine: lineIndex,
                    endLine: lineIndex
                };
            } else {
                // Missing time of day - questionable
                questionableItems.push({
                    type: 'scene_heading',
                    text: trimmed,
                    lineNumber: lineIndex + 1,
                    reason: 'Scene heading missing time of day (DAY/NIGHT)',
                    suggestion: trimmed + ' - DAY'
                });
            }
            previousType = elementType;
            continue;
        }
        
        // STRICT: Character must be all caps after blank line
        if (elementType === 'character') {
            // Exclude transitions and endings (even outside scenes)
            if (/^(FADE OUT|FADE IN|FADE TO BLACK|CUT TO|DISSOLVE TO|THE END|END|BLACK|MORE|CONT'D|CONTINUED)\.?$/i.test(trimmed)) {
                previousType = elementType;
                continue;
            }
            
            // Exclude narrative section headings (like "The blog post goes live:")
            if (/^(THE .* GOES LIVE|THE .* BEGINS|THE .* ENDS|THE .* ARRIVES)$/i.test(trimmed.replace(/:\s*$/, ''))) {
                previousType = elementType;
                continue;
            }
            
            // Only import characters that are within a scene
            if (!currentScene) {
                previousType = elementType;
                continue;
            }
            
            // Must be ALL CAPS
            if (trimmed !== trimmed.toUpperCase()) {
                questionableItems.push({
                    type: 'character',
                    text: trimmed,
                    lineNumber: lineIndex + 1,
                    reason: 'Character name must be ALL CAPS',
                    suggestion: trimmed.toUpperCase()
                });
                previousType = elementType;
                continue;
            }
            
            // Exclude centered text
            if (trimmed.startsWith('>')) {
                previousType = elementType;
                continue;
            }
            
            // Must be reasonable length (1-4 words)
            const wordCount = trimmed.split(/\s+/).length;
            if (wordCount > 4) {
                questionableItems.push({
                    type: 'character',
                    text: trimmed,
                    lineNumber: lineIndex + 1,
                    reason: 'Too long to be a character name (5+ words)',
                    suggestion: undefined
                });
                previousType = elementType;
                continue;
            }
            
            // Clean name
            let characterName = trimmed
                .replace(/\^$/, '')
                .replace(/\(.*\)$/, '')
                .trim();
            
            if (characterName) {
                characters.add(characterName);
                if (!currentScene.characters.includes(characterName)) {
                    currentScene.characters.push(characterName);
                }
                console.log('[AutoImport] ✓ Character:', characterName);
            }
        }
        
        previousType = elementType;
    }
    
    // Save last scene
    if (currentScene) {
        currentScene.endLine = lines.length - 1;
        scenes.push(currentScene);
    }
    
    // 🔥 NEW: Deduplicate character names using fuzzy matching
    // Merge similar names (e.g., "SARAH" + "SARAH CHEN" → keep "SARAH CHEN")
    const deduplicatedCharacters = new Set<string>();
    const characterNameMap = new Map<string, string>(); // Maps variations to canonical name
    
    const areNamesSimilar = (name1: string, name2: string): boolean => {
        const upper1 = name1.toUpperCase().trim();
        const upper2 = name2.toUpperCase().trim();
        
        if (upper1 === upper2) return true;
        
        // One contains the other as a whole word
        if (upper1.includes(upper2) || upper2.includes(upper1)) {
            const shorter = upper1.length < upper2.length ? upper1 : upper2;
            const longer = upper1.length >= upper2.length ? upper1 : upper2;
            
            if (shorter.length >= 3) {
                // Check if shorter is a whole word in longer
                const wordBoundaryRegex = new RegExp(`(^|\\s)${shorter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s|$)`, 'i');
                if (wordBoundaryRegex.test(longer)) return true;
                // Or at start/end
                if (longer.startsWith(shorter + ' ') || longer.endsWith(' ' + shorter)) return true;
            }
        }
        
        return false;
    };
    
    // Sort characters by length (longer names first) to prefer more specific names
    const sortedCharacters = Array.from(characters).sort((a, b) => b.length - a.length);
    
    for (const charName of sortedCharacters) {
        let isDuplicate = false;
        let canonicalName = charName;
        
        // Check if this name is similar to any already deduplicated name
        for (const existingName of deduplicatedCharacters) {
            if (areNamesSimilar(charName, existingName)) {
                // Prefer the longer/more specific name
                canonicalName = charName.length > existingName.length ? charName : existingName;
                characterNameMap.set(charName, canonicalName);
                characterNameMap.set(existingName, canonicalName);
                isDuplicate = true;
                console.log(`[AutoImport] 🔗 Merged character names: "${charName}" → "${canonicalName}"`);
                break;
            }
        }
        
        if (!isDuplicate) {
            deduplicatedCharacters.add(charName);
            characterNameMap.set(charName, charName);
        }
    }
    
    // Update character descriptions map to use canonical names
    const deduplicatedDescriptions = new Map<string, string>();
    for (const [originalName, description] of characterDescriptions.entries()) {
        const canonicalName = characterNameMap.get(originalName) || originalName;
        const existingDesc = deduplicatedDescriptions.get(canonicalName) || '';
        // Keep the longer description
        if (description.length > existingDesc.length) {
            deduplicatedDescriptions.set(canonicalName, description);
        } else if (!existingDesc) {
            deduplicatedDescriptions.set(canonicalName, description);
        }
    }
    
    // Update scene character arrays to use canonical names
    scenes.forEach(scene => {
        scene.characters = scene.characters.map(charName => 
            characterNameMap.get(charName) || charName
        );
        // Remove duplicates within scene
        scene.characters = Array.from(new Set(scene.characters));
    });
    
    console.log('[AutoImport] Complete:', {
        characters: Array.from(deduplicatedCharacters),
        originalCount: characters.size,
        deduplicatedCount: deduplicatedCharacters.size,
        locations: Array.from(locations),
        locationTypes: Array.from(locationTypes.entries()),
        scenes: scenes.length,
        questionable: questionableItems.length
    });
    
    return {
        locations,
        characters: deduplicatedCharacters, // 🔥 Return deduplicated set
        characterDescriptions: deduplicatedDescriptions, // 🔥 Return deduplicated descriptions
        locationTypes, // 🔥 NEW: Return location types map
        scenes,
        questionableItems
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

