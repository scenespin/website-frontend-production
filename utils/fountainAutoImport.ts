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
        group_label?: string; // 🔥 NEW: Section from Fountain (# Section)
        synopsis?: string; // 🔥 NEW: Synopsis from Fountain (= Synopsis)
        cameraDirections?: string[]; // 🔥 NEW: Camera directions extracted from scene (for Scene Builder prompting)
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
    let currentSection: string | null = null; // Track current section (# Section)
    let pendingSynopsis: string | null = null; // Track synopsis before next scene (= Synopsis)
    
    // Helper function to detect camera directions and transitions
    const isCameraDirection = (text: string): boolean => {
        const trimmed = text.trim().toUpperCase();
        // Check for camera direction patterns
        return /^(CLOSE ON|WIDE ON|PUSH IN|PULL OUT|ZOOM IN|ZOOM OUT|PAN TO|TILT UP|TILT DOWN|TRACK|DOLLY|CRANE|STEADICAM|HANDHELD|CAMERA|CU|WS|MS|LS|ECU|EWS|POV|OVER|UNDER|ANGLE ON|SHOT OF|VIEW OF|WE SEE|WE HEAR|INSERT|SUPER|TITLE|CREDITS|MONTAGE|SERIES OF|ESTABLISHING|ESTABLISH|EXTREME|TIGHT|LOOSE|FULL|MEDIUM|WIDE|EXTREME WIDE|EXTREME CLOSE|TWO SHOT|THREE SHOT|GROUP SHOT|REACTION SHOT|INSERT SHOT|ESTABLISHING SHOT)/i.test(trimmed) ||
               /^(CLOSE|WIDE|PUSH|PULL|ZOOM|PAN|TILT|TRACK|DOLLY|CRANE|STEADICAM|HANDHELD|CAMERA|CU|WS|MS|LS|ECU|EWS|POV|OVER|UNDER|ANGLE|SHOT|VIEW|INSERT|SUPER|TITLE|CREDITS|MONTAGE|ESTABLISHING|ESTABLISH|EXTREME|TIGHT|LOOSE|FULL|MEDIUM|REACTION|INSERT|ESTABLISHING)\s+(ON|OF|TO|OVER|UNDER|INTO|FROM|AT|THE|A|AN)/i.test(trimmed) ||
               // Additional patterns: "ON X", "BACK TO X", "SHOTS OF X"
               /^ON\s+/i.test(trimmed) ||
               /^BACK\s+TO\s+/i.test(trimmed) ||
               /^SHOTS?\s+OF\s+/i.test(trimmed);
    };
    
    // Helper function to detect transitions
    const isTransition = (text: string): boolean => {
        const trimmed = text.trim().toUpperCase();
        return trimmed.endsWith('TO:') || 
               /^(BACK TO|CUT TO|DISSOLVE TO|FADE TO|SMASH TO|MATCH CUT TO|WIPE TO)/i.test(trimmed);
    };
    
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
        
        // Skip application-specific section headings (e.g., = Characters =, = Act I =)
        // Note: These are NOT part of Fountain spec - they're custom metadata
        // Standard Fountain synopses (= Synopsis) are handled below
        if (trimmed.startsWith('=') && trimmed.endsWith('=') && trimmed.length > 2) {
            previousType = elementType;
            continue;
        }
        
        // Extract Section (# Section) - Standard Fountain syntax
        // Sections are organizational markers that don't appear in formatted output
        if (elementType === 'section') {
            // Extract section text (remove # prefix and trim)
            const sectionText = trimmed.replace(/^#+\s*/, '').trim();
            if (sectionText) {
                currentSection = sectionText;
                console.log('[AutoImport] ✓ Section:', currentSection);
            }
            previousType = elementType;
            continue;
        }
        
        // Extract Synopsis (= Synopsis) - Standard Fountain syntax
        // Synopses are single-line descriptions that don't appear in formatted output
        if (elementType === 'synopsis') {
            // Extract synopsis text (remove = prefix and trim)
            const synopsisText = trimmed.replace(/^=\s*/, '').trim();
            if (synopsisText) {
                // If we have a current scene, check if next non-empty line is a scene heading
                // If next non-empty line is scene heading, synopsis applies to next scene (keep as pending)
                // If next non-empty line is NOT scene heading, synopsis applies to current scene
                let nextNonEmptyLine = '';
                for (let j = lineIndex + 1; j < lines.length; j++) {
                    const nextTrimmed = lines[j].trim();
                    if (nextTrimmed) {
                        nextNonEmptyLine = nextTrimmed;
                        break;
                    }
                }
                // CRITICAL: Order matters! More specific patterns (INT./EXT., I./E.) must come BEFORE simpler ones (INT, EXT)
                const nextIsSceneHeading = /^(INT\.\/EXT\.|I\.\/E\.|INT\.?\/EXT|I\/E|EST|INT|EXT)[\.\s]/i.test(nextNonEmptyLine);
                
                if (currentScene && !nextIsSceneHeading) {
                    // Synopsis after scene heading (not before next scene) - apply to current scene
                    currentScene.synopsis = synopsisText;
                    console.log('[AutoImport] ✓ Synopsis (after scene):', synopsisText);
                } else {
                    // Synopsis before scene heading - store as pending for next scene
                    pendingSynopsis = synopsisText;
                    console.log('[AutoImport] ✓ Synopsis (pending):', pendingSynopsis);
                }
            }
            previousType = elementType;
            continue;
        }
        
        // STRICT: Scene heading must match proper format
        if (elementType === 'scene_heading') {
            if (currentScene) {
                currentScene.endLine = lineIndex - 1;
                scenes.push(currentScene);
            }
            
            // 🔥 ENHANCED: Capture location type (INT/EXT/INT-EXT)
            // Handle INT./EXT. format (with periods) and also handle cases where INT. might be missing from PDF import
            // CRITICAL: Order matters! More specific patterns (INT./EXT., I./E.) must come BEFORE simpler ones (INT, EXT)
            const locationMatch = trimmed.match(/^(INT\.\/EXT\.|I\.\/E\.|INT\.?\/EXT|I\/E|EST|INT|EXT)[\.\s]+(.+?)\s*-\s*(.+)$/i) ||
                                 trimmed.match(/^\/EXT\.\s+(.+?)\s*-\s*(.+)$/i); // Handle missing INT. prefix from PDF
            if (locationMatch) {
                // Handle case where INT. prefix was missing (PDF import issue)
                let typePrefix: string;
                let location: string;
                let time: string;
                
                if (locationMatch[1] === undefined) {
                    // This is the /EXT. pattern (missing INT. prefix)
                    typePrefix = 'INT./EXT';
                    location = locationMatch[2]?.trim() || '';
                    time = locationMatch[3]?.trim() || '';
                } else {
                    typePrefix = locationMatch[1].trim().toUpperCase();
                    location = locationMatch[2]?.trim() || '';
                    time = locationMatch[3]?.trim() || '';
                }
                
                // Normalize type to standard values
                let locationType: 'INT' | 'EXT' | 'INT/EXT';
                // Check INT/EXT patterns first (most specific)
                if (typePrefix === 'INT./EXT.' || typePrefix === 'INT./EXT' || typePrefix === 'INT/EXT' || 
                    typePrefix === 'I./E.' || typePrefix === 'I/E') {
                    locationType = 'INT/EXT';
                } else if (typePrefix === 'INT' || typePrefix === 'INT.') {
                    locationType = 'INT';
                } else if (typePrefix === 'EXT' || typePrefix === 'EXT.') {
                    locationType = 'EXT';
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
                    endLine: lineIndex,
                    group_label: currentSection || undefined, // 🔥 NEW: Apply current section to scene
                    synopsis: pendingSynopsis || undefined, // 🔥 NEW: Apply pending synopsis to scene
                    cameraDirections: [] // 🔥 NEW: Initialize camera directions array
                };
                
                // Clear pending synopsis after applying to scene (synopsis applies to next scene)
                pendingSynopsis = null;
            } else {
                // Missing time of day - flag for user to select (don't auto-correct)
                // Extract location without time of day
                // Also handle cases where INT. prefix might be missing from PDF import
                // CRITICAL: Order matters! More specific patterns (INT./EXT., I./E.) must come BEFORE simpler ones (INT, EXT)
                const locationMatch = trimmed.match(/^(INT\.\/EXT\.|I\.\/E\.|INT\.?\/EXT|I\/E|EST|INT|EXT)[\.\s]+(.+)$/i) ||
                                      trimmed.match(/^\/EXT\.\s+(.+)$/i); // Handle missing INT. prefix
                if (locationMatch) {
                    // Handle case where INT. prefix was missing (PDF import issue)
                    let typePrefix: string;
                    let location: string;
                    
                    if (locationMatch[1] === undefined) {
                        // This is the /EXT. pattern (missing INT. prefix)
                        typePrefix = 'INT./EXT';
                        location = locationMatch[2]?.trim() || '';
                    } else {
                        typePrefix = locationMatch[1].trim().toUpperCase();
                        location = locationMatch[2]?.trim() || '';
                    }
                    
                    // Normalize type to standard values
                    let locationType: 'INT' | 'EXT' | 'INT/EXT';
                    // Check INT/EXT patterns first (most specific)
                    if (typePrefix === 'INT./EXT.' || typePrefix === 'INT./EXT' || typePrefix === 'INT/EXT' || 
                        typePrefix === 'I./E.' || typePrefix === 'I/E') {
                        locationType = 'INT/EXT';
                    } else if (typePrefix === 'INT' || typePrefix === 'INT.') {
                        locationType = 'INT';
                    } else if (typePrefix === 'EXT' || typePrefix === 'EXT.') {
                        locationType = 'EXT';
                    } else {
                        locationType = 'INT'; // Default fallback
                    }
                    
                    locations.add(location);
                    locationTypes.set(location, locationType);
                    
                    // Create scene with original heading (user will select time of day)
                    currentScene = {
                        heading: trimmed, // Keep original - user will fix
                        location: location,
                        locationType: locationType,
                        characters: [],
                        startLine: lineIndex,
                        endLine: lineIndex,
                        group_label: currentSection || undefined,
                        synopsis: pendingSynopsis || undefined,
                        cameraDirections: []
                    };
                    
                    // Add to questionable items so user can select time of day
                    questionableItems.push({
                        type: 'scene_heading',
                        text: trimmed,
                        lineNumber: lineIndex + 1,
                        reason: 'Scene heading missing time of day',
                        suggestion: undefined // Will be set by user via dropdown
                    });
                } else {
                    // If we can't parse it, just flag it
                    questionableItems.push({
                        type: 'scene_heading',
                        text: trimmed,
                        lineNumber: lineIndex + 1,
                        reason: 'Scene heading missing time of day (DAY/NIGHT)',
                        suggestion: trimmed + ' - DAY'
                    });
                }
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
            
            // Extract camera directions instead of excluding them
            // Store them in scene metadata for Scene Builder prompting
            if (isCameraDirection(trimmed) && currentScene) {
                // Initialize cameraDirections array if it doesn't exist
                if (!currentScene.cameraDirections) {
                    currentScene.cameraDirections = [];
                }
                // Store the camera direction (keep original text for context)
                currentScene.cameraDirections.push(trimmed);
                console.log('[AutoImport] 📹 Camera direction:', trimmed);
                previousType = elementType;
                continue; // Don't treat as character
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
                // Before flagging as questionable, check if it's a camera direction or transition
                if (isCameraDirection(trimmed) && currentScene) {
                    // Initialize cameraDirections array if it doesn't exist
                    if (!currentScene.cameraDirections) {
                        currentScene.cameraDirections = [];
                    }
                    // Store the camera direction
                    currentScene.cameraDirections.push(trimmed);
                    console.log('[AutoImport] 📹 Camera direction:', trimmed);
                    previousType = elementType;
                    continue; // Don't treat as character
                }
                
                // Check if it's a transition
                if (isTransition(trimmed)) {
                    previousType = elementType;
                    continue; // Don't treat as character
                }
                
                // If it's 5+ words and all caps, it's likely an action line in all caps, not a character
                // Don't flag it as questionable - just skip it silently
                // Action lines can be in all caps for emphasis (e.g., "FUCKIN ROD TIDWELL YOU RULE YOU")
                previousType = elementType;
                continue;
            }
            
            // Clean name - preserve # signs (valid Fountain syntax for numbered characters like "REPORTER #1")
            let characterName = trimmed
                .replace(/\^$/, '') // Remove continuation marker
                .replace(/\(.*\)$/, '') // Remove parentheticals
                .trim();
            // Note: # signs are preserved - they're valid Fountain syntax (e.g., "REPORTER #1", "COP #2")
            
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

