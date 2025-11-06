'use client';

import { useState, useCallback } from 'react';
import { useEditor } from '@/contexts/EditorContext';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { 
    parseContentForImport, 
    shouldAutoImport, 
    formatLocationName, 
    formatCharacterName,
    QuestionableItem
} from '@/utils/fountainAutoImport';

interface ImportResults {
    characters: number;
    locations: number;
    scenes?: number;
}

interface ImportReviewData {
    original: string;
    corrected: string;
    issues: any[]; // Legacy, not used
    importedCharacters: string[];
    importedLocations: string[];
    importedScenes: number;
    questionableItems: QuestionableItem[];
}

interface UseScriptImportReturn {
    // Paste handler
    handlePaste: (e: React.ClipboardEvent<HTMLTextAreaElement>) => Promise<void>;
    
    // Modal state
    importReviewModal: {
        show: boolean;
        data: ImportReviewData | null;
        onClose: () => void;
    };
    
    // Notification state
    importNotification: {
        show: boolean;
        results: ImportResults | null;
        onClose: () => void;
    };
}

/**
 * Custom hook to handle screenplay import functionality
 * Extracts paste handling, validation, and bulk import logic from FountainEditor
 */
export function useScriptImport(): UseScriptImportReturn {
    const { setContent, markSaved } = useEditor();
    const screenplay = useScreenplay();
    
    // Import review modal state
    const [showImportReviewModal, setShowImportReviewModal] = useState(false);
    const [importReviewData, setImportReviewData] = useState<ImportReviewData | null>(null);
    
    // Import notification state
    const [showImportNotification, setShowImportNotification] = useState(false);
    const [importResults, setImportResults] = useState<ImportResults | null>(null);
    
    /**
     * Perform the actual import of characters, locations, and scenes
     */
    const performImport = useCallback(async (content: string) => {
        try {
            // Parse the content
            const parseResult = parseContentForImport(content);
            
            // Format names
            const characterNames = Array.from(parseResult.characters).map(formatCharacterName);
            const locationNames = Array.from(parseResult.locations).map(formatLocationName);
            
            console.log('[useScriptImport] Parsed raw:', {
                rawCharacters: Array.from(parseResult.characters),
                rawLocations: Array.from(parseResult.locations),
                rawScenes: parseResult.scenes
            });
            
            console.log('[useScriptImport] Found:', {
                characters: characterNames.length,
                characterNames: characterNames,
                locations: locationNames.length,
                locationNames: locationNames,
                scenes: parseResult.scenes.length,
                characterDescriptions: parseResult.characterDescriptions ? Array.from(parseResult.characterDescriptions.entries()) : []
            });
            
            // Bulk import characters and locations
            let importedChars = 0;
            let importedLocs = 0;
            let importedScenes = 0;
            
            const importedCharacters = characterNames.length > 0 
                ? await screenplay.bulkImportCharacters(characterNames, parseResult.characterDescriptions) 
                : [];
            importedChars = importedCharacters.length;
            
            const importedLocations = locationNames.length > 0 
                ? await screenplay.bulkImportLocations(locationNames) 
                : [];
            importedLocs = importedLocations.length;
            
            // Distribute scenes across the 8-sequence structure proportionally
            if (parseResult.scenes.length > 0) {
                // FIRST: Delete "Imported Scenes" beat if it exists (legacy)
                const importedScenesBeat = screenplay.beats.find(b => b.title === 'Imported Scenes');
                if (importedScenesBeat) {
                    console.log('[useScriptImport] Removing legacy "Imported Scenes" beat');
                    await screenplay.deleteBeat(importedScenesBeat.id);
                }
                
                // Map character names to IDs
                const characterMap = new Map(
                    importedCharacters.map(char => [char.name.toUpperCase(), char.id])
                );
                
                // Map location names to IDs
                const locationMap = new Map(
                    importedLocations.map(loc => [loc.name.toUpperCase(), loc.id])
                );
                
                // Calculate total script lines to determine proportional distribution
                const totalLines = content.split('\n').length;
                const scenesCount = parseResult.scenes.length;
                
                // Standard 8-Sequence breakdown (as percentages of total):
                // Seq 1: 0-12.5%    (Status Quo)
                // Seq 2: 12.5-22.7% (Predicament) 
                // Seq 3: 22.7-37.5% (Lock In)
                // Seq 4: 37.5-50%   (First Culmination)
                // Seq 5: 50-62.5%   (Midpoint Shift)
                // Seq 6: 62.5-77.3% (Complications)
                // Seq 7: 77.3-87.5% (All Is Lost)
                // Seq 8: 87.5-100%  (Resolution)
                const sequenceBreakpoints = [0, 0.125, 0.227, 0.375, 0.50, 0.625, 0.773, 0.875, 1.0];
                
                // Get existing 8-sequence beats (refresh after potential deletion)
                const sequenceBeats = screenplay.beats
                    .filter(b => b.title.includes('Sequence '))
                    .sort((a, b) => a.order - b.order);
                
                console.log('[useScriptImport] Found', sequenceBeats.length, 'sequence beats');
                
                if (sequenceBeats.length !== 8) {
                    console.error('[useScriptImport] ⚠️ Expected 8 sequence beats, found', sequenceBeats.length);
                    return;
                }
                
                // Prepare scenes grouped by sequence
                const scenesBySequence: Array<Array<{
                    heading: string;
                    location: string;
                    characterIds: string[];
                    locationId?: string;
                    startLine: number;
                    endLine: number;
                }>> = Array(8).fill(null).map(() => []);
                
                // Distribute each scene to the appropriate sequence based on its position
                parseResult.scenes.forEach((scene, index) => {
                    // Calculate scene position as percentage of total scenes
                    const scenePosition = index / scenesCount;
                    
                    // Find which sequence this scene belongs to
                    let sequenceIndex = 0;
                    for (let i = 0; i < sequenceBreakpoints.length - 1; i++) {
                        if (scenePosition >= sequenceBreakpoints[i] && scenePosition < sequenceBreakpoints[i + 1]) {
                            sequenceIndex = i;
                            break;
                        }
                    }
                    
                    // Match character names to IDs
                    const characterIds = scene.characters
                        .map(charName => characterMap.get(formatCharacterName(charName).toUpperCase()))
                        .filter((id): id is string => id !== undefined);
                    
                    // Match location to ID
                    const locationId = locationMap.get(formatLocationName(scene.location).toUpperCase());
                    
                    scenesBySequence[sequenceIndex].push({
                        heading: scene.heading,
                        location: scene.location,
                        characterIds,
                        locationId,
                        startLine: scene.startLine,
                        endLine: scene.endLine
                    });
                });
                
                // Import scenes into each sequence
                for (let i = 0; i < 8; i++) {
                    if (scenesBySequence[i].length > 0 && sequenceBeats[i]) {
                        const createdScenes = await screenplay.bulkImportScenes(
                            sequenceBeats[i].id, 
                            scenesBySequence[i]
                        );
                        importedScenes += createdScenes.length;
                        
                        console.log('[useScriptImport] Sequence', i + 1, ':', createdScenes.length, 'scenes');
                    }
                }
                
                console.log('[useScriptImport] Total scenes imported:', importedScenes, 'across', sequenceBeats.length, 'sequences');
            }
            
            // Show notification if anything was imported
            if (importedChars > 0 || importedLocs > 0 || importedScenes > 0) {
                setImportResults({ 
                    characters: importedChars, 
                    locations: importedLocs,
                    scenes: importedScenes 
                });
                setShowImportNotification(true);
                
                // Auto-hide after 6 seconds
                setTimeout(() => {
                    setShowImportNotification(false);
                }, 6000);
            }
        } catch (error) {
            console.error('[useScriptImport] Auto-import failed:', error);
        }
    }, [screenplay]);
    
    /**
     * Handle paste events for auto-import detection
     */
    const handlePaste = useCallback(async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
        const pastedText = e.clipboardData.getData('text');
        
        console.log('[useScriptImport] Paste detected. Length:', pastedText.length, 'chars');
        
        // Check if this looks like a full screenplay that should be auto-imported
        if (shouldAutoImport(pastedText)) {
            console.log('[useScriptImport] ✅ Detected screenplay paste, parsing...');
            
            // Parse the content (strict Fountain parsing)
            const parseResult = parseContentForImport(pastedText);
            
            console.log('[useScriptImport] Parse complete:', {
                characters: parseResult.characters.size,
                locations: parseResult.locations.size,
                scenes: parseResult.scenes.length,
                questionable: parseResult.questionableItems.length,
                characterDescriptions: parseResult.characterDescriptions ? Array.from(parseResult.characterDescriptions.entries()) : []
            });
            
            // Auto-import the confident items
            const characterNames = Array.from(parseResult.characters);
            const locationNames = Array.from(parseResult.locations);
            
            // Import characters with descriptions
            if (characterNames.length > 0) {
                await screenplay.bulkImportCharacters(characterNames, parseResult.characterDescriptions);
            }
            
            // Import locations
            if (locationNames.length > 0) {
                await screenplay.bulkImportLocations(locationNames);
            }
            
            console.log('[useScriptImport] ✓ Auto-imported', characterNames.length, 'characters and', locationNames.length, 'locations');
            
            // Show modal if there are questionable items
            if (parseResult.questionableItems.length > 0) {
                console.log('[useScriptImport] Showing review modal for', parseResult.questionableItems.length, 'questionable items');
                setImportReviewData({
                    original: pastedText,
                    corrected: pastedText, // No correction needed
                    issues: [], // Legacy field, not used anymore
                    importedCharacters: characterNames,
                    importedLocations: locationNames,
                    importedScenes: parseResult.scenes.length,
                    questionableItems: parseResult.questionableItems
                });
                setShowImportReviewModal(true);
            }
            
            // Allow the paste to happen normally (content goes into editor)
            // No need to preventDefault - let it paste, we've already imported the metadata
            
        } else {
            console.log('[useScriptImport] ❌ Not a screenplay (no scene headings), allowing normal paste');
        }
    }, [screenplay, performImport]);
    
    /**
     * Handle import review modal close
     */
    const handleImportClose = useCallback(() => {
        setShowImportReviewModal(false);
        setImportReviewData(null);
    }, []);
    
    /**
     * Close import notification
     */
    const handleNotificationClose = useCallback(() => {
        setShowImportNotification(false);
    }, []);
    
    return {
        handlePaste,
        importReviewModal: {
            show: showImportReviewModal,
            data: importReviewData,
            onClose: handleImportClose
        },
        importNotification: {
            show: showImportNotification,
            results: importResults,
            onClose: handleNotificationClose
        }
    };
}

