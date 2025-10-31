/**
 * String Matching Utilities
 * 
 * Fuzzy matching and similarity calculation for strings
 * Used for scene heading matching and character name matching
 */

/**
 * Calculate text similarity (0-1)
 * Simple Levenshtein-based similarity
 * 
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Similarity score from 0 to 1
 */
export function calculateSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
}

/**
 * Calculate Levenshtein distance between two strings
 * Classic dynamic programming algorithm for edit distance
 * 
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Edit distance
 */
export function levenshteinDistance(str1, str2) {
    const matrix = [];
    
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
 * Match scene heading text to a scene
 * Uses fuzzy matching to handle slight variations
 * 
 * @param {string} heading - Scene heading to match
 * @param {Array} scenes - Array of scenes to match against
 * @param {number} [threshold=0.85] - Similarity threshold (0-1)
 * @returns {string|null} Matched scene ID or null
 */
export function matchSceneHeading(heading, scenes, threshold = 0.85) {
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
        if (calculateSimilarity(normalizedHeading, sceneHeading) > threshold) {
            return scene.id;
        }
    }
    
    return null;
}

/**
 * Match character names to character objects using fuzzy matching
 * 
 * @param {Array<string>} names - Character names to match
 * @param {Array} characters - All characters
 * @param {number} [threshold=0.8] - Similarity threshold (0-1)
 * @returns {Map<string, string>} Map of name to character ID
 */
export function matchCharacterNames(names, characters, threshold = 0.8) {
    const matches = new Map();
    
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
                ) > threshold) {
                    matches.set(name, character.id);
                    break;
                }
            }
        }
    }
    
    return matches;
}

/**
 * Find best match from a list of options
 * 
 * @param {string} query - Query string
 * @param {Array<string>} options - List of options to match against
 * @param {number} [threshold=0.7] - Minimum similarity threshold
 * @returns {{match: string|null, score: number}} Best match and its score
 */
export function findBestMatch(query, options, threshold = 0.7) {
    let bestMatch = null;
    let bestScore = 0;
    
    const normalizedQuery = query.trim().toUpperCase();
    
    for (const option of options) {
        const normalizedOption = option.trim().toUpperCase();
        const score = calculateSimilarity(normalizedQuery, normalizedOption);
        
        if (score > bestScore && score >= threshold) {
            bestScore = score;
            bestMatch = option;
        }
    }
    
    return { match: bestMatch, score: bestScore };
}

/**
 * Check if two strings are similar enough to be considered a match
 * 
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @param {number} [threshold=0.8] - Similarity threshold (0-1)
 * @returns {boolean} True if strings are similar
 */
export function isSimilar(str1, str2, threshold = 0.8) {
    return calculateSimilarity(str1, str2) >= threshold;
}

