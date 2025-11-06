'use client';

import { useState, useCallback } from 'react';
import { useEditor } from '@/contexts/EditorContext';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { 
    parseContentForImport, 
    shouldAutoImport, 
    formatLocationName, 
    formatCharacterName 
} from '@/utils/fountainAutoImport';
import { validateFountainContent, FormatIssue } from '@/utils/fountainValidator';
import { smartFormat } from '@/utils/fountainCorrector';

interface ImportResults {
    characters: number;
    locations: number;
    scenes?: number;
}

interface ImportReviewData {
    original: string;
    corrected: string;
    issues: FormatIssue[];
}

interface UseScriptImportReturn {
    // Paste handler
    handlePaste: (e: React.ClipboardEvent<HTMLTextAreaElement>) => Promise<void>;
    
    // Modal state
    importReviewModal: {
        show: boolean;
        data: ImportReviewData | null;
        onAccept: (correctedContent: string) => Promise<void>;
        onReject: () => void;
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
                scenes: parseResult.scenes.length
            });
            
            // Bulk import characters and locations
            let importedChars = 0;
            let importedLocs = 0;
            let importedScenes = 0;
            
            const importedCharacters = characterNames.length > 0 
                ? await screenplay.bulkImportCharacters(characterNames) 
                : [];
            importedChars = importedCharacters.length;
            
            const importedLocations = locationNames.length > 0 
                ? await screenplay.bulkImportLocations(locationNames) 
                : [];
            importedLocs = importedLocations.length;
            
            // Distribute scenes across the 8-sequence structure proportionally
            if (parseResult.scenes.length > 0) {
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
                
                // Get existing 8-sequence beats (or use defaults if missing)
                const sequenceBeats = screenplay.beats.filter(b => 
                    b.title.includes('Sequence ')
                ).sort((a, b) => a.order - b.order);
                
                console.log('[useScriptImport] Found', sequenceBeats.length, 'sequence beats');
                
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
        console.log('[useScriptImport] First 200 chars:', pastedText.substring(0, 200));
        
        // Check if this looks like a full screenplay that should be auto-imported
        if (shouldAutoImport(pastedText)) {
            console.log('[useScriptImport] ✅ Detected screenplay paste, analyzing for auto-import...');
            
            // Validate the content
            const validation = validateFountainContent(pastedText);
            
            console.log('[useScriptImport] Validation result:', {
                hasAutoFixableIssues: validation.hasAutoFixableIssues,
                issueCount: validation.issues.length,
                issues: validation.issues
            });
            
            if (validation.hasAutoFixableIssues) {
                // Apply smart formatting
                const corrected = smartFormat(pastedText);
                
                console.log('[useScriptImport] Found', validation.issues.length, 'formatting issues, showing review modal');
                
                // Show review modal
                e.preventDefault(); // Prevent default paste
                setImportReviewData({
                    original: pastedText,
                    corrected,
                    issues: validation.issues
                });
                setShowImportReviewModal(true);
            } else {
                console.log('[useScriptImport] No formatting issues, proceeding with direct import');
                // No issues, proceed with normal import
                await performImport(pastedText);
            }
        } else {
            console.log('[useScriptImport] ❌ Not a screenplay (no scene headings), allowing normal paste');
        }
    }, [performImport]);
    
    /**
     * Handle import review modal - Accept corrected content
     */
    const handleImportAccept = useCallback(async (correctedContent: string) => {
        setShowImportReviewModal(false);
        setImportReviewData(null);
        
        // Set the corrected content in the editor
        setContent(correctedContent);
        
        // Mark as saved to clear "Saving..." indicator
        markSaved();
        
        // Perform the import
        await performImport(correctedContent);
    }, [setContent, markSaved, performImport]);
    
    /**
     * Handle import review modal - Reject corrections, use original
     */
    const handleImportReject = useCallback(() => {
        setShowImportReviewModal(false);
        const originalContent = importReviewData?.original;
        setImportReviewData(null);
        
        // User wants to keep original, perform import anyway
        if (originalContent) {
            performImport(originalContent);
        }
    }, [importReviewData, performImport]);
    
    /**
     * Handle import review modal - Close without importing
     */
    const handleImportClose = useCallback(() => {
        setShowImportReviewModal(false);
        setImportReviewData(null);
        // Just close, don't import anything
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
            onAccept: handleImportAccept,
            onReject: handleImportReject,
            onClose: handleImportClose
        },
        importNotification: {
            show: showImportNotification,
            results: importResults,
            onClose: handleNotificationClose
        }
    };
}

