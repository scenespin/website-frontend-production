/**
 * LinePositionCache - Optimized line-to-character position mapping
 * 
 * Provides O(1) lookups for character position at a given line number
 * after an initial O(n) build of the line index.
 * 
 * This is critical for performance when navigating to scenes in large
 * screenplays, as it avoids iterating through lines on every navigation.
 */
export class LinePositionCache {
    private cache: Map<string, number[]> = new Map();
    private maxCacheSize: number = 10; // Limit cache size to prevent memory issues
    
    /**
     * Get the character position at the start of a given line number
     * 
     * @param content - The full text content
     * @param lineNumber - Line number (1-based)
     * @returns Character position at the start of that line
     */
    getCharPosition(content: string, lineNumber: number): number {
        // Use content length as cache key for quick comparison
        // In production, might want to use a hash for very large content
        const cacheKey = `${content.length}`;
        
        // Check if we have a cached index for this content
        if (!this.cache.has(cacheKey)) {
            // Build and cache the line index
            const lineIndex = this.buildLineIndex(content);
            
            // Manage cache size - remove oldest entry if at max
            if (this.cache.size >= this.maxCacheSize) {
                const firstKey = this.cache.keys().next().value;
                this.cache.delete(firstKey);
            }
            
            this.cache.set(cacheKey, lineIndex);
        }
        
        const lineIndex = this.cache.get(cacheKey)!;
        
        // Return position at line (or 0 if line number is out of bounds)
        return lineIndex[lineNumber - 1] || 0;
    }
    
    /**
     * Build an index of character positions for each line
     * 
     * Algorithm:
     * 1. Split content into lines
     * 2. Create positions array starting with [0]
     * 3. For each line, calculate cumulative position:
     *    positions[i+1] = positions[i] + line[i].length + 1 (for newline)
     * 
     * Complexity: O(n) where n is number of lines
     * 
     * @param content - The full text content
     * @returns Array of character positions, indexed by line number (0-based)
     */
    private buildLineIndex(content: string): number[] {
        const lines = content.split('\n');
        const positions: number[] = [0]; // Line 1 starts at position 0
        
        // Calculate cumulative positions
        for (let i = 0; i < lines.length - 1; i++) {
            // Position of next line = current position + current line length + 1 (newline)
            positions.push(positions[i] + lines[i].length + 1);
        }
        
        return positions;
    }
    
    /**
     * Clear all cached line indices
     * Call this if you need to free memory
     */
    clear(): void {
        this.cache.clear();
    }
    
    /**
     * Get cache statistics for monitoring
     */
    getStats(): { size: number; maxSize: number } {
        return {
            size: this.cache.size,
            maxSize: this.maxCacheSize
        };
    }
}

