'use client';

import { useState, useCallback } from 'react';
import { useEditor } from '@/contexts/EditorContext';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { toast } from 'sonner';
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
                questionable: parseResult.questionableItems?.length || 0,
                characterDescriptions: parseResult.characterDescriptions ? Array.from(parseResult.characterDescriptions.entries()) : []
            });
            
            // Import scenes into story beats (this will also import characters and locations)
            await performImport(pastedText);
                
            console.log('[useScriptImport] ✓ Auto-import complete');
            
            // Show success toast with import summary
            if (parseResult.characters.size > 0 || parseResult.locations.size > 0 || parseResult.scenes.length > 0) {
                toast.success('✅ Screenplay Imported', {
                    description: `${parseResult.characters.size} characters, ${parseResult.locations.size} locations, ${parseResult.scenes.length} scenes`
                });
            }
            
            // Show modal if there are questionable items
            if (parseResult.questionableItems && parseResult.questionableItems.length > 0) {
                console.log('[useScriptImport] Showing review modal for', parseResult.questionableItems.length, 'questionable items');
                toast.warning('⚠️ Some formatting issues detected', {
                    description: `${parseResult.questionableItems.length} items need review. Check the modal for details.`
                });
                setImportReviewData({
                    original: pastedText,
                    corrected: pastedText, // No correction needed
                    issues: [], // Legacy field, not used anymore
                    importedCharacters: Array.from(parseResult.characters),
                    importedLocations: Array.from(parseResult.locations),
                    importedScenes: parseResult.scenes.length,
                    questionableItems: parseResult.questionableItems
                });
                setShowImportReviewModal(true);
            }
            
            // Warn if very few items were imported (might indicate poor formatting)
            if (parseResult.scenes.length > 3 && parseResult.characters.size === 0 && parseResult.locations.size === 0) {
                toast.warning('⚠️ No characters or locations detected', {
                    description: 'Make sure character names are in ALL CAPS and scene headings start with INT./EXT.'
                });
            }
            
            // Save the pasted content to editor context
            // Let the paste happen naturally, then save it after a brief delay
            setTimeout(() => {
                setContent(pastedText);
        markSaved();
            }, 100);
            
        } else {
            console.log('[useScriptImport] ❌ Not a screenplay (no scene headings), allowing normal paste');
    
            // Show helpful info toast if pasting substantial text without screenplay format
            const lineCount = pastedText.split('\n').length;
            if (lineCount > 10) {
                toast.info('ℹ️ Plain text pasted', {
                    description: 'No screenplay detected. Add scene headings (INT./EXT.) to enable auto-import.',
                    duration: 5000
                });
            }
        }
    }, [screenplay, setContent, markSaved]);
    
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

