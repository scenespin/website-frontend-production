/**
 * Fountain Tagging System
 * 
 * Parses and injects @location and @characters tags into Fountain screenplay files
 * Tags are invisible in PDF but maintain relationships in relationships.json
 */

import type { Scene, Character, Location, Relationships } from '../../types/screenplay';

/**
 * Scene tags extracted from Fountain content
 */
export interface SceneTags {
    sceneId: string;
    sceneHeading: string;
    characters: string[]; // Character UUIDs
    location?: string; // Location UUID
    startLine: number;
    endLine: number;
}

/**
 * Extract tags from Fountain screenplay content
 * 
 * @param fountainContent Fountain file content
 * @returns Array of scene tags
 */
export function extractTags(fountainContent: string): SceneTags[] {
    const lines = fountainContent.split('\n');
    const sceneTags: SceneTags[] = [];
    
    let currentScene: SceneTags | null = null;
    let lineNumber = 0;
    
    for (const line of lines) {
        lineNumber++;
        
        // Detect scene headings (INT/EXT/INT./EXT.)
        const sceneHeadingMatch = line.match(/^(INT|EXT|INT\.\/EXT|INT\/EXT|I\/E)[.\s]/i);
        
        if (sceneHeadingMatch) {
            // Save previous scene if exists
            if (currentScene) {
                currentScene.endLine = lineNumber - 1;
                sceneTags.push(currentScene);
            }
            
            // Start new scene
            currentScene = {
                sceneId: '', // Will be matched later
                sceneHeading: line.trim(),
                characters: [],
                location: undefined,
                startLine: lineNumber,
                endLine: lineNumber
            };
        }
        
        // Extract @location tag
        const locationMatch = line.match(/@location:\s*([a-f0-9-]+)/i);
        if (locationMatch && currentScene) {
            currentScene.location = locationMatch[1];
        }
        
        // Extract @characters tag (comma-separated UUIDs)
        const charactersMatch = line.match(/@characters:\s*([a-f0-9-,\s]+)/i);
        if (charactersMatch && currentScene) {
            const charIds = charactersMatch[1]
                .split(',')
                .map(id => id.trim())
                .filter(id => id.length > 0);
            currentScene.characters = charIds;
        }
        
        // Extract individual @character tag
        const characterMatch = line.match(/@character:\s*([a-f0-9-]+)/i);
        if (characterMatch && currentScene) {
            const charId = characterMatch[1];
            if (!currentScene.characters.includes(charId)) {
                currentScene.characters.push(charId);
            }
        }
    }
    
    // Save last scene
    if (currentScene) {
        currentScene.endLine = lineNumber;
        sceneTags.push(currentScene);
    }
    
    return sceneTags;
}

/**
 * Inject tags into a scene in Fountain content
 * 
 * @param fountainContent Original Fountain content
 * @param scene Scene to inject tags for
 * @param characters Characters appearing in scene
 * @param location Location of scene
 * @returns Updated Fountain content
 */
export function injectTags(
    fountainContent: string,
    scene: Scene,
    characters: Character[],
    location?: Location
): string {
    const lines = fountainContent.split('\n');
    let result: string[] = [];
    let inTargetScene = false;
    let tagsInjected = false;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Check if this is the scene heading we're looking for
        if (line.trim() === scene.heading.trim()) {
            inTargetScene = true;
            result.push(line);
            
            // Inject tags after scene heading
            if (!tagsInjected) {
                if (location) {
                    result.push(`@location: ${location.id}`);
                }
                if (characters.length > 0) {
                    const charIds = characters.map(c => c.id).join(', ');
                    result.push(`@characters: ${charIds}`);
                }
                tagsInjected = true;
            }
            continue;
        }
        
        // Skip existing tag lines in this scene
        if (inTargetScene && (
            line.match(/@location:/) ||
            line.match(/@characters:/) ||
            line.match(/@character:/)
        )) {
            continue; // Remove old tags
        }
        
        // Check for next scene heading (end of current scene)
        if (inTargetScene && line.match(/^(INT|EXT|INT\.\/EXT|INT\/EXT|I\/E)[.\s]/i)) {
            inTargetScene = false;
        }
        
        result.push(line);
    }
    
    return result.join('\n');
}

/**
 * Update all scene tags in Fountain content based on relationships
 * 
 * @param content Fountain content
 * @param scenes All scenes
 * @param characters All characters
 * @param locations All locations
 * @param relationships Relationships data
 * @returns Updated Fountain content
 */
export function updateScriptTags(
    content: string,
    scenes: Scene[],
    characters: Character[],
    locations: Location[],
    relationships: Relationships
): string {
    let updatedContent = content;
    
    // Process each scene
    for (const scene of scenes) {
        const sceneRelations = relationships.scenes[scene.id];
        if (!sceneRelations) continue;
        
        // Get characters in this scene
        const sceneCharacters = sceneRelations.characters
            .map((charId: string) => characters.find((c: Character) => c.id === charId))
            .filter((c): c is Character => c !== undefined);
        
        // Get location for this scene
        const sceneLocation = sceneRelations.location
            ? locations.find(l => l.id === sceneRelations.location)
            : undefined;
        
        // Inject tags
        updatedContent = injectTags(
            updatedContent,
            scene,
            sceneCharacters,
            sceneLocation
        );
    }
    
    return updatedContent;
}

/**
 * Remove all tags from Fountain content
 * Useful for clean export
 * 
 * @param fountainContent Fountain content with tags
 * @returns Clean Fountain content
 */
export function removeTags(fountainContent: string): string {
    return fountainContent
        .split('\n')
        .filter(line => !line.match(/@(location|characters?|scene):/))
        .join('\n');
}

/**
 * Match scene heading text to a scene ID
 * Uses fuzzy matching to handle slight variations
 * 
 * @param heading Scene heading from Fountain
 * @param scenes Array of scenes to match against
 * @returns Matched scene ID or null
 */
export function matchSceneHeading(heading: string, scenes: Scene[]): string | null {
    const normalizedHeading = heading.trim().toUpperCase();
    
    // Try exact match first
    for (const scene of scenes) {
        if (scene.heading.trim().toUpperCase() === normalizedHeading) {
            return scene.id;
        }
    }
    
    // Try fuzzy match (allowing for minor differences)
    for (const scene of scenes) {
        const sceneHeading = scene.heading.trim().toUpperCase();
        
        // Calculate simple similarity
        if (calculateSimilarity(normalizedHeading, sceneHeading) > 0.85) {
            return scene.id;
        }
    }
    
    return null;
}

/**
 * Calculate text similarity (0-1)
 * Simple Levenshtein-based similarity
 */
function calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];
    
    for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    
    return matrix[str2.length][str1.length];
}

/**
 * Extract character names from dialogue in Fountain content
 * Used to suggest characters for a scene
 * 
 * @param fountainContent Fountain scene content
 * @returns Array of character names
 */
export function extractCharacterNames(fountainContent: string): string[] {
    const lines = fountainContent.split('\n');
    const characterNames = new Set<string>();
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Character name is in all caps, optionally followed by (parenthetical)
        // Must be followed by dialogue
        if (line === line.toUpperCase() &&
            line.length > 0 &&
            !line.match(/^(INT|EXT|FADE|CUT|DISSOLVE)/) &&
            i + 1 < lines.length) {
            
            // Remove (parenthetical) if present
            const cleanName = line.replace(/\s*\([^)]*\)/, '').trim();
            
            if (cleanName.length > 0) {
                characterNames.add(cleanName);
            }
        }
    }
    
    return Array.from(characterNames);
}

/**
 * Match character names to character IDs using fuzzy matching
 * 
 * @param names Character names from Fountain
 * @param characters All characters
 * @returns Map of name to character ID
 */
export function matchCharacterNames(
    names: string[],
    characters: Character[]
): Map<string, string> {
    const matches = new Map<string, string>();
    
    for (const name of names) {
        const normalizedName = name.trim().toUpperCase();
        
        // Try exact match
        for (const character of characters) {
            if (character.name.trim().toUpperCase() === normalizedName) {
                matches.set(name, character.id);
                break;
            }
        }
        
        // If no exact match, try fuzzy
        if (!matches.has(name)) {
            for (const character of characters) {
                if (calculateSimilarity(
                    normalizedName,
                    character.name.trim().toUpperCase()
                ) > 0.8) {
                    matches.set(name, character.id);
                    break;
                }
            }
        }
    }
    
    return matches;
}

