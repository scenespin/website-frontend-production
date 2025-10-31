/**
 * AutoSaveManager - Decoupled auto-save system
 * 
 * Handles debounced saves outside React's state management
 * to avoid infinite loop issues with useEffect.
 * 
 * Tag Management Strategy:
 * - Tags (@location:, @characters:) are injected during SAVE
 * - Tags are stripped from DISPLAY (visual editor)
 * - Tags persist in the underlying content for GitHub storage
 * - This keeps the editor clean while maintaining relationships
 */

import type { StoryBeat, Character, Location, Relationships } from '../../types/screenplay';
import { extractTags, updateScriptTags, removeTags } from './fountainTags';

interface AutoSaveConfig {
    debounceMs: number;
    onSave: () => void;
    onError: (error: Error) => void;
}

export class AutoSaveManager {
    private timer: NodeJS.Timeout | null = null;
    private isSaving: boolean = false;
    private lastSavedContent: string = '';
    private lastScheduledContent: string = '';
    private config: AutoSaveConfig;
    
    constructor(config: AutoSaveConfig) {
        this.config = config;
    }
    
    /**
     * Schedule a save operation (debounced)
     * Returns true if save was scheduled, false if skipped
     */
    scheduleSave(
        content: string,
        isDirty: boolean,
        beats: StoryBeat[],
        characters: Character[],
        locations: Location[],
        relationships: Relationships,
        setContent: (content: string, markDirty: boolean) => void,
        markSaved: () => void
    ): boolean {
        // Skip if empty
        if (content.trim().length === 0) {
            return false;
        }
        
        // Skip if not dirty
        if (!isDirty) {
            return false;
        }
        
        // Skip if currently saving
        if (this.isSaving) {
            return false;
        }
        
        // Skip if content matches what we already saved or scheduled
        if (content === this.lastSavedContent || content === this.lastScheduledContent) {
            return false;
        }
        
        // Track that we're scheduling this content
        this.lastScheduledContent = content;
        
        // Clear any existing timer
        if (this.timer) {
            clearTimeout(this.timer);
        }
        
        // Schedule the save
        this.timer = setTimeout(() => {
            this.performSave(
                content,
                beats,
                characters,
                locations,
                relationships,
                setContent,
                markSaved
            );
        }, this.config.debounceMs);
        
        return true;
    }
    
    /**
     * Force an immediate save (no debounce)
     */
    forceSave(
        content: string,
        beats: StoryBeat[],
        characters: Character[],
        locations: Location[],
        relationships: Relationships,
        setContent: (content: string, markDirty: boolean) => void,
        markSaved: () => void
    ): void {
        // Clear any pending timer
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
        
        this.performSave(
            content,
            beats,
            characters,
            locations,
            relationships,
            setContent,
            markSaved
        );
    }
    
    /**
     * Internal: Perform the actual save operation
     */
    private async performSave(
        content: string,
        beats: StoryBeat[],
        characters: Character[],
        locations: Location[],
        relationships: Relationships,
        setContent: (content: string, markDirty: boolean) => void,
        markSaved: () => void
    ): Promise<void> {
        // Set saving flag
        this.isSaving = true;
        
        try {
            console.log('[AutoSaveManager] Starting save (TAG INJECTION TEMPORARILY DISABLED)...');
            
            // TEMPORARY FIX: Don't inject tags for now to fix the infinite loop
            // TODO: Re-enable tag injection once we fix the line number alignment
            
            /*
            // Extract scene tags
            const sceneTags = extractTags(content);
            console.log('[AutoSaveManager] Extracted scene tags:', sceneTags);
            
            // Flatten beats to get all scenes
            const allScenes = beats.flatMap(beat => beat.scenes);
            
            // Update content with injected tags
            const updatedContent = updateScriptTags(
                content,
                allScenes,
                characters,
                locations,
                relationships
            );
            
            // Track this as saved content
            this.lastSavedContent = updatedContent;
            this.lastScheduledContent = updatedContent;
            
            // Only update React state if content actually changed
            if (updatedContent !== content) {
                console.log('[AutoSaveManager] Tags injected, updating content');
                // Update without marking dirty (tags are auto-generated)
                setContent(updatedContent, false);
            }
            */
            
            // TEMPORARY: Just track as saved without modification
            this.lastSavedContent = content;
            this.lastScheduledContent = content;
            
            // Mark as saved
            markSaved();
            
            // Callback to parent
            this.config.onSave();
            
            console.log('[AutoSaveManager] Save complete (no tag injection)');
            
        } catch (error) {
            console.error('[AutoSaveManager] Save error:', error);
            this.config.onError(error as Error);
        } finally {
            // Clear saving flag
            this.isSaving = false;
        }
    }
    
    /**
     * Cancel any pending save
     */
    cancel(): void {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }
    
    /**
     * Reset all tracking (useful for cleanup)
     */
    reset(): void {
        this.cancel();
        this.isSaving = false;
        this.lastSavedContent = '';
        this.lastScheduledContent = '';
    }
    
    /**
     * Load content from storage (strips tags for clean display)
     * Call this when loading a screenplay from GitHub
     * 
     * @param savedContent Content with tags from storage
     * @returns Clean content without visible tags
     */
    loadContent(savedContent: string): string {
        // Strip tags for display
        const cleanContent = removeTags(savedContent);
        
        // Track as saved content (with tags)
        this.lastSavedContent = savedContent;
        this.lastScheduledContent = savedContent;
        
        console.log('[AutoSaveManager] Loaded content, stripped tags for display');
        
        return cleanContent;
    }
    
    /**
     * Check if currently saving
     */
    get saving(): boolean {
        return this.isSaving;
    }
}

