/**
 * Dependency Checker Utility
 * 
 * Checks entity usage before deletion to prevent breaking references
 * Used by delete confirmation dialogs
 */

import type {
    Character,
    Location,
    Scene,
    StoryBeat,
    Relationships,
    CharacterDependencies,
    LocationDependencies
} from '@/types/screenplay';

/**
 * Check character dependencies across screenplay
 * 
 * @param characterId Character ID to check
 * @param relationships Relationships data
 * @param scenes Direct scenes array (scenes are stored directly, not in beats)
 * @param beats Optional: Frontend-only UI templates (for beat relationships in reports)
 * @returns Character dependencies
 */
export function getCharacterDependencies(
    characterId: string,
    relationships: Relationships,
    scenes: Scene[],
    beats?: StoryBeat[]
): CharacterDependencies {
    const charRels = relationships.characters[characterId];
    
    if (!charRels) {
        return {
            scenes: [],
            beats: [],
            totalAppearances: 0
        };
    }
    
    // 🔥 FIX: Use scenes array directly (beats are frontend-only UI templates)
    // This ensures we're checking against the actual current scenes
    const validSceneIds = new Set(scenes.map(s => s.id));
    
    // Find scenes where character appears - filter by valid scene IDs
    const scenesWhereAppears = charRels.appearsInScenes
        .filter(sceneId => validSceneIds.has(sceneId)) // 🔥 FIX: Filter out deleted scene IDs
        .map(sceneId => scenes.find(s => s.id === sceneId))
        .filter((s): s is Scene => s !== undefined);
    
    // Find beats that contain those scenes (optional - beats are frontend-only)
    const relatedBeats = beats ? (() => {
        const uniqueBeatIds = new Set(charRels.relatedBeats);
        return beats.filter(beat => uniqueBeatIds.has(beat.id));
    })() : [];
    
    return {
        scenes: scenesWhereAppears,
        beats: relatedBeats,
        totalAppearances: scenesWhereAppears.length
    };
}

/**
 * Check location dependencies across screenplay
 * 
 * @param locationId Location ID to check
 * @param relationships Relationships data
 * @param scenes Direct scenes array (scenes are stored directly, not in beats)
 * @returns Location dependencies
 */
export function getLocationDependencies(
    locationId: string,
    relationships: Relationships,
    scenes: Scene[]
): LocationDependencies {
    const locRels = relationships.locations[locationId];
    
    if (!locRels) {
        return {
            scenes: [],
            totalUsages: 0
        };
    }
    
    // 🔥 FIX: Use scenes array directly (beats are frontend-only UI templates)
    // This ensures we're checking against the actual current scenes
    const validSceneIds = new Set(scenes.map(s => s.id));
    
    // Find scenes that use this location - filter by valid scene IDs
    const scenesWhereUsed = locRels.scenes
        .filter(sceneId => validSceneIds.has(sceneId)) // 🔥 FIX: Filter out deleted scene IDs
        .map(sceneId => scenes.find(s => s.id === sceneId))
        .filter((s): s is Scene => s !== undefined);
    
    return {
        scenes: scenesWhereUsed,
        totalUsages: scenesWhereUsed.length
    };
}

/**
 * Check if a scene can be safely deleted
 * 
 * @param sceneId Scene ID to check
 * @param beats All story beats
 * @returns Object indicating if safe to delete
 */
export function canDeleteScene(
    sceneId: string,
    beats: StoryBeat[]
): { safe: boolean; reason?: string } {
    const allScenes = beats.flatMap(beat => beat.scenes);
    const scene = allScenes.find(s => s.id === sceneId);
    
    if (!scene) {
        return { safe: false, reason: 'Scene not found' };
    }
    
    // Feature 0117: Scenes can generally be deleted safely
    // Check if it's the only scene in its beat (frontend grouping)
    const beat = beats.find(b => b.scenes.some(s => s.id === sceneId));
    if (beat && beat.scenes.length === 1) {
        return {
            safe: true,
            reason: 'This is the only scene in its story beat'
        };
    }
    
    return { safe: true };
}

/**
 * Check if a story beat can be safely deleted
 * 
 * @param beatId Beat ID to check
 * @param beats All story beats
 * @returns Object indicating if safe to delete with warnings
 */
export function canDeleteBeat(
    beatId: string,
    beats: StoryBeat[]
): { safe: boolean; reason?: string; sceneCount: number } {
    const beat = beats.find(b => b.id === beatId);
    
    if (!beat) {
        return { safe: false, reason: 'Beat not found', sceneCount: 0 };
    }
    
    const sceneCount = beat.scenes.length;
    
    if (sceneCount > 0) {
        return {
            safe: true,
            reason: `Contains ${sceneCount} scene${sceneCount !== 1 ? 's' : ''} that will also be deleted`,
            sceneCount
        };
    }
    
    return { safe: true, sceneCount: 0 };
}

/**
 * Generate a dependency report for character
 * 
 * @param characterId Character ID
 * @param character Character object
 * @param dependencies Character dependencies
 * @returns Human-readable report
 */
export function generateCharacterReport(
    characterId: string,
    character: Character,
    dependencies: CharacterDependencies
): string {
    const { scenes, beats, totalAppearances } = dependencies;
    
    if (totalAppearances === 0) {
        return `${character.name} does not appear in any scenes and can be safely deleted.`;
    }
    
    const parts = [
        `**${character.name}** appears in **${totalAppearances} scene${totalAppearances !== 1 ? 's' : ''}**`,
    ];
    
    if (beats.length > 0) {
        parts.push(`across **${beats.length} story beat${beats.length !== 1 ? 's' : ''}**`);
    }
    
    parts.push('.');
    
    // List affected scenes
    if (scenes.length > 0) {
        parts.push('\n\n**Affected Scenes:**');
        scenes.slice(0, 5).forEach(scene => {
            parts.push(`\n- Scene ${scene.number}: ${scene.heading}`);
        });
        
        if (scenes.length > 5) {
            parts.push(`\n- ...and ${scenes.length - 5} more`);
        }
    }
    
    parts.push('\n\n**Warning:** Deleting this character will remove all references from these scenes.');
    
    return parts.join('');
}

/**
 * Generate a dependency report for location
 * 
 * @param locationId Location ID
 * @param location Location object
 * @param dependencies Location dependencies
 * @returns Human-readable report
 */
export function generateLocationReport(
    locationId: string,
    location: Location,
    dependencies: LocationDependencies
): string {
    const { scenes, totalUsages } = dependencies;
    
    if (totalUsages === 0) {
        return `**${location.name}** is not used in any scenes and can be safely deleted.`;
    }
    
    const parts = [
        `**${location.name}** is used in **${totalUsages} scene${totalUsages !== 1 ? 's' : ''}**.`,
    ];
    
    // List affected scenes
    if (scenes.length > 0) {
        parts.push('\n\n**Affected Scenes:**');
        scenes.slice(0, 5).forEach(scene => {
            parts.push(`\n- Scene ${scene.number}: ${scene.heading}`);
        });
        
        if (scenes.length > 5) {
            parts.push(`\n- ...and ${scenes.length - 5} more`);
        }
    }
    
    parts.push('\n\n**Warning:** Deleting this location will clear the location field in these scenes.');
    
    return parts.join('');
}

/**
 * Validate relationships data for consistency
 * Checks for broken references and orphaned entities
 * 
 * @param beats All story beats
 * @param characters All characters
 * @param locations All locations
 * @param relationships Relationships data
 * @returns Array of validation errors
 */
export function validateRelationships(
    beats: StoryBeat[],
    characters: Character[],
    locations: Location[],
    relationships: Relationships
): Array<{ type: 'error' | 'warning'; message: string }> {
    const errors: Array<{ type: 'error' | 'warning'; message: string }> = [];
    
    const allScenes = beats.flatMap(beat => beat.scenes);
    const sceneIds = new Set(allScenes.map(s => s.id));
    const charIds = new Set(characters.map(c => c.id));
    const locIds = new Set(locations.map(l => l.id));
    
    // Check scene relationships
    for (const [sceneId, sceneRel] of Object.entries(relationships.scenes)) {
        if (!sceneIds.has(sceneId)) {
            errors.push({
                type: 'error',
                message: `Scene ${sceneId} in relationships but not in beats`
            });
            continue;
        }
        
        // Check character references
        for (const charId of sceneRel.characters) {
            if (!charIds.has(charId)) {
                errors.push({
                    type: 'error',
                    message: `Scene ${sceneId} references non-existent character ${charId}`
                });
            }
        }
        
        // Check location reference
        if (sceneRel.location && !locIds.has(sceneRel.location)) {
            errors.push({
                type: 'error',
                message: `Scene ${sceneId} references non-existent location ${sceneRel.location}`
            });
        }
    }
    
    // Check character relationships
    for (const [charId, charRel] of Object.entries(relationships.characters)) {
        if (!charIds.has(charId)) {
            errors.push({
                type: 'warning',
                message: `Character ${charId} in relationships but not in character list`
            });
            continue;
        }
        
        // Check scene references
        for (const sceneId of charRel.appearsInScenes) {
            if (!sceneIds.has(sceneId)) {
                errors.push({
                    type: 'error',
                    message: `Character ${charId} references non-existent scene ${sceneId}`
                });
            }
        }
    }
    
    // Check location relationships
    for (const [locId, locRel] of Object.entries(relationships.locations)) {
        if (!locIds.has(locId)) {
            errors.push({
                type: 'warning',
                message: `Location ${locId} in relationships but not in location list`
            });
            continue;
        }
        
        // Check scene references
        for (const sceneId of locRel.scenes) {
            if (!sceneIds.has(sceneId)) {
                errors.push({
                    type: 'error',
                    message: `Location ${locId} references non-existent scene ${sceneId}`
                });
            }
        }
    }
    
    return errors;
}

