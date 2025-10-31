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
            
            // Create a default "Imported Scenes" story beat if we have scenes
            if (parseResult.scenes.length > 0) {
                // Check if an "Imported Scenes" beat already exists
                let importBeat = screenplay.beats.find(b => b.title === 'Imported Scenes');
                
                // Create beat if it doesn't exist
                if (!importBeat) {
                    importBeat = await screenplay.createBeat({
                        title: 'Imported Scenes',
                        description: 'Scenes automatically imported from pasted Fountain screenplay',
                        order: screenplay.beats.length,
                        scenes: []
                    });
                }
                
                // Map character names to IDs
                const characterMap = new Map(
                    importedCharacters.map(char => [char.name.toUpperCase(), char.id])
                );
                
                // Map location names to IDs
                const locationMap = new Map(
                    importedLocations.map(loc => [loc.name.toUpperCase(), loc.id])
                );
                
                // Prepare scene data with character/location IDs
                const sceneDataArray = parseResult.scenes.map(scene => {
                    // Match character names to IDs
                    const characterIds = scene.characters
                        .map(charName => characterMap.get(formatCharacterName(charName).toUpperCase()))
                        .filter((id): id is string => id !== undefined);
                    
                    // Match location to ID
                    const locationId = locationMap.get(formatLocationName(scene.location).toUpperCase());
                    
                    return {
                        heading: scene.heading,
                        location: scene.location,
                        characterIds,
                        locationId,
                        startLine: scene.startLine,
                        endLine: scene.endLine
                    };
                });
                
                // Bulk create scenes
                const createdScenes = await screenplay.bulkImportScenes(importBeat.id, sceneDataArray);
                importedScenes = createdScenes.length;
                
                console.log('[useScriptImport] Created', importedScenes, 'scenes in beat:', importBeat.title);
                console.log('[useScriptImport] Scene details:', createdScenes.map(s => ({
                    id: s.id,
                    heading: s.heading,
                    startLine: s.fountain.startLine,
                    endLine: s.fountain.endLine
                })));
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

