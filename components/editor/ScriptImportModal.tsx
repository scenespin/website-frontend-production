'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { useEditor } from '@/contexts/EditorContext';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { parseContentForImport } from '@/utils/fountainAutoImport';
import { updateScreenplay } from '@/utils/screenplayStorage';
import { getCurrentScreenplayId } from '@/utils/clerkMetadata';
import { normalizeScreenplayText } from '@/utils/screenplayNormalizer';
import { processChunkedImport } from '@/utils/screenplayStreamParser';
import { toast } from 'sonner';
import { FileText, Upload, AlertTriangle, CheckCircle, X, File } from 'lucide-react';
import type { Character, Location, Scene, StoryBeat } from '@/types/screenplay';
import { extractTextFromPDF, isPDFFile } from '@/utils/pdfTextExtractor';
import { extractTextFromWord, isWordFile } from '@/utils/wordTextExtractor';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface ScriptImportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ScriptImportModal({ isOpen, onClose }: ScriptImportModalProps) {
    const { getToken } = useAuth();
    const { user } = useUser(); // Feature 0119: Get user for Clerk metadata
    const { setContent, saveNow, state: editorState } = useEditor();
    const editorContent = editorState.content;
    const screenplay = useScreenplay();
    
    const [content, setContentLocal] = useState('');
    const [isImporting, setIsImporting] = useState(false);
    const [parseResult, setParseResult] = useState<any>(null);
    const [showWarning, setShowWarning] = useState(false); // 🔥 NEW: Warning dialog state
    const [normalizationProgress, setNormalizationProgress] = useState<number | null>(null); // Feature 0177: Progress for large files
    const [isExtractingPDF, setIsExtractingPDF] = useState(false); // 🔥 NEW: PDF extraction state
    const [isExtractingWord, setIsExtractingWord] = useState(false); // 🔥 NEW: Word extraction state
    const [uploadedFileName, setUploadedFileName] = useState<string | null>(null); // 🔥 NEW: Track uploaded file name
    const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload'); // 🔥 NEW: Tab state
    
    // Parse content whenever it changes (debounced)
    // Feature 0177: Normalize content before parsing
    useEffect(() => {
        if (!content.trim()) {
            setParseResult(null);
            setNormalizationProgress(null);
            return;
        }
        
        const timer = setTimeout(async () => {
            try {
                // Feature 0177: Normalize content before parsing
                const isLargeFile = content.length > 1024 * 1024; // >1MB
                
                let normalized: string;
                if (isLargeFile) {
                    // Large file: use chunked processing with progress
                    setNormalizationProgress(0);
                    normalized = await processChunkedImport(
                        content,
                        (chunk) => normalizeScreenplayText(chunk),
                        (progress) => setNormalizationProgress(progress)
                    );
                    setNormalizationProgress(null);
                } else {
                    // Small file: normalize in one pass
                    normalized = normalizeScreenplayText(content);
                }
                
                const result = parseContentForImport(normalized);
                setParseResult(result);
            } catch (error) {
                console.error('[ScriptImportModal] Parse error:', error);
                setNormalizationProgress(null);
            }
        }, 500); // Debounce 500ms
        
        return () => clearTimeout(timer);
    }, [content]);
    
    // 🔥 NEW: Handle file upload (PDF or Word)
    const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;
        
        const file = files[0];
        
        // Check file size (50MB limit)
        if (file.size > 50 * 1024 * 1024) {
            toast.error('File is too large. Maximum size is 50MB.');
            return;
        }
        
        // Determine file type and extract
        if (isPDFFile(file)) {
            setIsExtractingPDF(true);
            setUploadedFileName(file.name);
            
            try {
                toast.info('Extracting text from PDF...', { duration: 2000 });
                
                const result = await extractTextFromPDF(file);
                
                if (!result.success) {
                    throw new Error(result.error || 'Failed to extract text from PDF');
                }
                
                if (!result.text.trim()) {
                    throw new Error('PDF appears to be empty or contains no extractable text');
                }
                
                // Set extracted text as content (will trigger parsing via useEffect)
                setContentLocal(result.text);
                
                toast.success(`✅ PDF extracted successfully (${result.pageCount} pages)`, {
                    description: 'Review the preview below and click Import when ready'
                });
                
            } catch (error) {
                console.error('[ScriptImportModal] PDF extraction error:', error);
                toast.error('Failed to extract text from PDF', {
                    description: error instanceof Error ? error.message : 'Please try another PDF file'
                });
                setUploadedFileName(null);
            } finally {
                setIsExtractingPDF(false);
                event.target.value = '';
            }
        } else if (isWordFile(file)) {
            setIsExtractingWord(true);
            setUploadedFileName(file.name);
            
            try {
                toast.info('Extracting text from Word document...', { duration: 2000 });
                
                const result = await extractTextFromWord(file);
                
                if (!result.success) {
                    throw new Error(result.error || 'Failed to extract text from Word document');
                }
                
                if (!result.text.trim()) {
                    throw new Error('Word document appears to be empty or contains no extractable text');
                }
                
                // Set extracted text as content (will trigger parsing via useEffect)
                setContentLocal(result.text);
                
                toast.success('✅ Word document extracted successfully', {
                    description: 'Review the preview below and click Import when ready'
                });
                
            } catch (error) {
                console.error('[ScriptImportModal] Word extraction error:', error);
                toast.error('Failed to extract text from Word document', {
                    description: error instanceof Error ? error.message : 'Please try another Word file'
                });
                setUploadedFileName(null);
            } finally {
                setIsExtractingWord(false);
                event.target.value = '';
            }
        } else {
            toast.error('Please select a PDF or Word (.docx) file');
            return;
        }
    }, []);
    
    const handleImport = useCallback(async () => {
        if (!content.trim()) {
            toast.error('Please paste a screenplay first');
            return;
        }
        
        if (!parseResult) {
            toast.error('Parsing screenplay...');
            return;
        }
        
        // 🔥 NEW: Check if user has existing data
        // Only show warning if there's actual content (not just default 8-beat template)
        // Check: characters, locations, scenes, OR editor has content
        const hasExistingData = screenplay.characters.length > 0 
            || screenplay.locations.length > 0 
            || screenplay.scenes.length > 0
            || (editorContent && editorContent.trim().length > 0); // Editor has actual content
        
        if (hasExistingData && !showWarning) {
            // Show warning first
            setShowWarning(true);
            return;
        }
        
        setIsImporting(true);
        
        try {
            console.log('[ScriptImportModal] 🔥 DESTRUCTIVE IMPORT - Starting...');
            
            // 🔥 CRITICAL: Ensure screenplay exists in DynamoDB FIRST
            if (!screenplay.screenplayId) {
                console.log('[ScriptImportModal] ⚠️ No screenplay_id yet - creating screenplay first...');
                // Set content so EditorContext can save it
                setContent(content);
                // Trigger screenplay creation
                await saveNow();
                console.log('[ScriptImportModal] ✅ Screenplay saved');
                
                // Feature 0119: Get screenplay ID from Clerk metadata (falls back to localStorage)
                const screenplayId = getCurrentScreenplayId(user);
                if (!screenplayId) {
                    throw new Error('Failed to get screenplay ID after save');
                }
                console.log('[ScriptImportModal] ✅ Got screenplay ID:', screenplayId);
            }
            
            // Feature 0119: Get screenplay ID from Clerk metadata (falls back to localStorage)
            const screenplayId = getCurrentScreenplayId(user);
            if (!screenplayId) {
                throw new Error('No screenplay ID available');
            }
            
            // 🔥 STEP 1: Delete old data from DynamoDB FIRST
            console.log('[ScriptImportModal] 🗑️  Clearing all data from DynamoDB...');
            await screenplay.clearAllData();
            console.log('[ScriptImportModal] ✅ DynamoDB cleared');
            
            // 🔥 STEP 2: Reset frontend state to get fresh 8-beat structure
            console.log('[ScriptImportModal] 🧹 Calling clearContentOnly() to get fresh 8-beat structure...');
            const freshBeats = await screenplay.clearContentOnly();
            console.log('[ScriptImportModal] ✅ Have', freshBeats.length, 'beats for scene distribution');
            
            if (freshBeats.length === 0) {
                throw new Error('clearContentOnly() returned empty array - this should never happen!');
            }
            
            // Step 2: Normalize and set content in editor
            // Feature 0177: Normalize content before setting in editor
            const isLargeFile = content.length > 1024 * 1024; // >1MB
            let normalizedContent: string;
            
            if (isLargeFile) {
                // Large file: use chunked processing with progress
                setNormalizationProgress(0);
                normalizedContent = await processChunkedImport(
                    content,
                    (chunk) => normalizeScreenplayText(chunk),
                    (progress) => setNormalizationProgress(progress)
                );
                setNormalizationProgress(null);
            } else {
                // Small file: normalize in one pass
                normalizedContent = normalizeScreenplayText(content);
            }
            
            setContent(normalizedContent);
            
            // Step 3: Import characters (with explicit screenplay ID)
            let importedCharacters: Character[] = [];
            if (parseResult.characters.size > 0) {
                const characterNames = Array.from(parseResult.characters) as string[];
                const characterDescriptions = parseResult.characterDescriptions || new Map<string, string>();
                importedCharacters = await screenplay.bulkImportCharacters(characterNames, characterDescriptions, screenplayId);
                console.log('[ScriptImportModal] ✅ Imported', characterNames.length, 'characters');
            }
            
            // Step 4: Import locations (with explicit screenplay ID and types)
            let importedLocations: Location[] = [];
            if (parseResult.locations.size > 0) {
                const locationNames = Array.from(parseResult.locations) as string[];
                const locationTypes = parseResult.locationTypes; // 🔥 NEW: Get location types map
                importedLocations = await screenplay.bulkImportLocations(locationNames, locationTypes, screenplayId);
                console.log('[ScriptImportModal] ✅ Imported', locationNames.length, 'locations with types');
            }
            
            // Step 5: Build complete beat structure with scenes (NO STATE UPDATES)
            // 🔥 PROPER FIX: Build data structure first, THEN save in one operation
            let scenesWithOrder: Scene[] = []; // Declare outside if block for optimistic UI
            if (parseResult.scenes.length > 0) {
                // 🔥 CRITICAL: Use freshBeats which we got directly from clearContentOnly()
                // No more waiting for React state! We have the data synchronously!
                if (freshBeats.length === 0) {
                    throw new Error('No beats available for scene import. Please refresh and try again.');
                }
                
                console.log('[ScriptImportModal] ✅ Using', freshBeats.length, 'fresh beats for scene import (no state timing issues!)');
                
                // 🔥 PROPER FIX: Build Scene objects directly (don't use bulkImportScenes yet)
                const now = new Date().toISOString();
                const allScenes = parseResult.scenes.map((scene, globalIndex) => {
                    // Map character names to IDs
                    const characterIds = (scene.characters || [])
                        .map(charName => {
                            const char = importedCharacters.find(c => 
                                c.name.toUpperCase() === charName.toUpperCase()
                            );
                            return char?.id;
                        })
                        .filter(Boolean) as string[];
                    
                    // Map location name to ID
                    const location = importedLocations.find(l => 
                        l.name.toUpperCase() === scene.location.toUpperCase()
                    );
                    
                    // Create full Scene object
                    return {
                        id: `scene-${Date.now()}-${globalIndex}-${Math.random().toString(36).substr(2, 9)}`,
                        // Feature 0117: beatId removed - scenes use global order
                        number: globalIndex + 1,
                        heading: scene.heading,
                        synopsis: scene.synopsis || `Imported from script`, // 🔥 NEW: Use extracted synopsis from Fountain
                        status: 'draft' as const,
                        order: 0, // Will be set to global order (1, 2, 3...)
                        group_label: scene.group_label, // 🔥 NEW: Use extracted section from Fountain
                        fountain: {
                            startLine: scene.startLine,
                            endLine: scene.endLine,
                            tags: {
                                characters: characterIds,
                                location: location?.id
                            }
                        },
                        createdAt: now,
                        updatedAt: now
                    };
                });
                
                console.log('[ScriptImportModal] ✅ Built', allScenes.length, 'complete Scene objects');
                
                // 🔥 Feature 0117: Simplified - assign global order (1, 2, 3, 4...)
                // Use group_label from Fountain sections if available, otherwise assign based on scene position
                scenesWithOrder = allScenes.map((scene, index) => {
                    // If scene already has group_label from Fountain section, use it
                    // Otherwise, optionally assign based on scene position (fallback)
                    let group_label = scene.group_label;
                    if (!group_label) {
                        // Fallback: For 8-beat template, divide scenes into 8 groups
                        const beatTitles = ['Setup', 'Inciting Incident', 'First Plot Point', 'First Pinch Point', 
                                          'Midpoint', 'Second Pinch Point', 'Second Plot Point', 'Resolution'];
                        const scenesPerGroup = Math.ceil(allScenes.length / 8);
                        const groupIndex = Math.floor(index / scenesPerGroup);
                        group_label = groupIndex < beatTitles.length ? beatTitles[groupIndex] : undefined;
                    }
                    
                    return {
                        ...scene,
                        order: index + 1, // Global order (1, 2, 3, 4...)
                        group_label // Use Fountain section or fallback assignment
                    };
                });
                
                console.log('[ScriptImportModal] ✅ Assigned global order to', scenesWithOrder.length, 'scenes');
                
                // Feature 0117: Save scenes to wryda-scenes table (with explicit screenplay ID)
                console.log('[ScriptImportModal] 💾 Saving scenes to wryda-scenes table...');
                await screenplay.saveScenes(scenesWithOrder, screenplayId);
                console.log('[ScriptImportModal] ✅ Saved', scenesWithOrder.length, 'scenes to wryda-scenes table');
            }
            
            // Step 6: Update screenplay content to DynamoDB AND localStorage
            console.log('[ScriptImportModal] 💾 Updating screenplay content...');
            localStorage.setItem('screenplay_draft', content);
            
            // Also save content to DynamoDB so it persists on refresh
            if (screenplay.screenplayId) {
                await updateScreenplay({
                    screenplay_id: screenplay.screenplayId,
                    content: content
                }, getToken);
                console.log('[ScriptImportModal] ✅ Saved content to DynamoDB');
            }
            
            // 🔥 OPTIMISTIC UI: Update React state immediately instead of reloading page
            // This makes data appear instantly while DynamoDB saves in background
            console.log('[ScriptImportModal] ⚡ Applying optimistic UI updates...');
            
            // Get the current state after bulk imports (which updated internal state)
            const currentState = screenplay.getCurrentState();
            
            // Update characters state with ALL characters (existing + newly imported)
            screenplay.setCharacters?.(currentState.characters);
            console.log('[ScriptImportModal] ✅ Updated characters state:', currentState.characters.length);
            
            // Update locations state with ALL locations (existing + newly imported)
            screenplay.setLocations?.(currentState.locations);
            console.log('[ScriptImportModal] ✅ Updated locations state:', currentState.locations.length);
            
            // 🔥 Beats removed - update scenes state directly
            screenplay.setScenes?.(scenesWithOrder);
            console.log('[ScriptImportModal] ✅ Updated scenes state:', scenesWithOrder.length);
            
            // Keep beats as empty UI templates (for backward compatibility if needed)
            const currentBeats = screenplay.getCurrentState().beats;
            const updatedBeats = screenplay.groupScenesIntoBeats?.(scenesWithOrder, currentBeats) || currentBeats;
            screenplay.setBeats?.(updatedBeats);
            
            // 🔥 FIX: Explicitly rebuild relationships after import to ensure scene counts are correct
            // The useEffect might not trigger immediately, so we call it explicitly
            await screenplay.updateRelationships?.();
            console.log('[ScriptImportModal] ✅ Rebuilt relationships for scene counts');
            
            // Success toast
            toast.success('✅ Screenplay Imported', {
                description: `${parseResult.characters.size} characters, ${parseResult.locations.size} locations, ${parseResult.scenes.length} scenes`
            });
            
            // Close modal - data appears instantly!
            console.log('[ScriptImportModal] ⚡ Import complete - data visible immediately!');
            onClose();
            
        } catch (error) {
            console.error('[ScriptImportModal] Import failed:', error);
            toast.error('❌ Import failed', {
                description: error instanceof Error ? error.message : 'Please try again'
            });
        } finally {
            setIsImporting(false);
        }
    }, [content, parseResult, setContent, screenplay, saveNow, onClose, showWarning, editorContent]);
    
    if (!isOpen) return null;
    
    const hasData = parseResult && (
        parseResult.characters.size > 0 || 
        parseResult.locations.size > 0 || 
        parseResult.scenes.length > 0
    );
    
    const hasWarnings = parseResult?.questionableItems && parseResult.questionableItems.length > 0;
    
    return (
        <>
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-[#0A0A0A]/95 backdrop-blur-sm z-50"
                onClick={onClose}
            />
            
            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                <div 
                    className="bg-[#0A0A0A] border border-[#3F3F46] rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col pointer-events-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-[#3F3F46] bg-[#141414]">
                        <div className="flex items-center gap-3">
                            <FileText className="w-6 h-6 text-[#DC143C]" />
                            <h2 className="text-2xl font-bold text-[#FFFFFF]">Import Screenplay</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-[#808080] hover:text-[#FFFFFF] transition-colors p-2 hover:bg-[#1F1F1F] rounded-lg"
                            disabled={isImporting}
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#0A0A0A]">
                        {/* Instructions */}
                        <div className="p-4 bg-[#141414] border border-[#3F3F46] rounded-lg">
                            <div className="flex items-start gap-3">
                                <Upload className="w-5 h-5 text-[#DC143C] mt-0.5" />
                                <span className="text-[#FFFFFF] text-sm">Upload a PDF or Word document, or paste your screenplay in Fountain format. We'll automatically detect characters, locations, and scenes.</span>
                            </div>
                        </div>
                        
                        {/* 🔥 NEW: Tabs for Upload vs Paste */}
                        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'upload' | 'paste')} className="w-full">
                            <TabsList className="grid w-full grid-cols-2 bg-[#1F1F1F] border border-[#3F3F46]">
                                <TabsTrigger 
                                    value="upload" 
                                    className="data-[state=active]:bg-[#DC143C] data-[state=active]:text-white data-[state=inactive]:text-[#808080]"
                                >
                                    <Upload className="w-4 h-4 mr-2" />
                                    Upload File
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="paste" 
                                    className="data-[state=active]:bg-[#DC143C] data-[state=active]:text-white data-[state=inactive]:text-[#808080]"
                                >
                                    <FileText className="w-4 h-4 mr-2" />
                                    Paste Text
                                </TabsTrigger>
                            </TabsList>
                            
                            {/* Upload Tab */}
                            <TabsContent value="upload" className="mt-4 space-y-4">
                                <div>
                                    <label className="block mb-2">
                                        <span className="text-sm font-medium text-[#FFFFFF]">Upload PDF or Word Document</span>
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="file"
                                            accept=".pdf,application/pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                            onChange={handleFileUpload}
                                            disabled={isImporting || isExtractingPDF || isExtractingWord}
                                            className="file-input w-full max-w-xs bg-[#1F1F1F] border-[#3F3F46] text-[#FFFFFF] file:bg-[#DC143C] file:text-white file:border-0 file:rounded file:px-4 file:py-2 file:cursor-pointer hover:file:bg-[#DC143C]/90"
                                        />
                                        {(isExtractingPDF || isExtractingWord) && (
                                            <div className="flex items-center gap-2 text-sm text-[#808080]">
                                                <span className="loading loading-spinner loading-sm"></span>
                                                <span>
                                                    {isExtractingPDF && 'Extracting text from PDF...'}
                                                    {isExtractingWord && 'Extracting text from Word document...'}
                                                </span>
                                            </div>
                                        )}
                                        {uploadedFileName && !isExtractingPDF && !isExtractingWord && (
                                            <div className="flex items-center gap-2 text-sm text-[#DC143C]">
                                                <CheckCircle className="w-4 h-4" />
                                                <span className="text-[#FFFFFF]">{uploadedFileName}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-2">
                                        <span className="text-xs text-[#808080]">
                                            Supports PDF and Word (.docx) files. Files will be automatically converted to Fountain format.
                                        </span>
                                    </div>
                                </div>
                                
                                {content && (
                                    <div className="mt-4 p-4 bg-[#141414] border border-[#3F3F46] rounded-lg">
                                        <div className="text-sm text-[#808080] mb-2">
                                            Extracted content preview ({content.length} characters):
                                        </div>
                                        <textarea
                                            className="textarea w-full h-32 font-mono text-xs bg-[#0A0A0A] border-[#3F3F46] text-[#FFFFFF]"
                                            value={content}
                                            readOnly
                                        />
                                    </div>
                                )}
                            </TabsContent>
                            
                            {/* Paste Tab */}
                            <TabsContent value="paste" className="mt-4">
                                <div>
                                    <label className="block mb-2">
                                        <span className="text-sm font-medium text-[#FFFFFF]">Paste Screenplay Content</span>
                                    </label>
                                    <textarea
                                        className="textarea w-full h-64 font-mono text-sm bg-[#0A0A0A] border-[#3F3F46] text-[#FFFFFF] placeholder:text-[#808080]"
                                        placeholder="Paste your screenplay here in Fountain format..."
                                        value={content}
                                        onChange={(e) => {
                                            setContentLocal(e.target.value);
                                            setUploadedFileName(null); // Clear file name when manually editing
                                        }}
                                        disabled={isImporting || isExtractingPDF || isExtractingWord}
                                    />
                                    {/* Feature 0177: Progress indicator for large file normalization */}
                                    {normalizationProgress !== null && (
                                        <div className="mt-2">
                                            <div className="flex items-center justify-between text-sm text-[#808080] mb-1">
                                                <span>Normalizing screenplay...</span>
                                                <span>{Math.round(normalizationProgress * 100)}%</span>
                                            </div>
                                            <progress 
                                                className="progress w-full bg-[#1F1F1F] progress-[#DC143C]" 
                                                value={normalizationProgress} 
                                                max={1}
                                            />
                                        </div>
                                    )}
                                </div>
                            </TabsContent>
                        </Tabs>
                        
                        {/* Preview Panel */}
                        {hasData && (
                            <div className="p-6 bg-[#141414] border border-[#3F3F46] rounded-lg">
                                <h3 className="text-lg font-semibold text-[#FFFFFF] mb-4">Preview</h3>
                                
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="p-4 bg-[#0A0A0A] border border-[#3F3F46] rounded-lg">
                                        <div className="text-xs text-[#808080] mb-1">Characters</div>
                                        <div className="text-2xl font-bold text-[#DC143C]">{parseResult.characters.size}</div>
                                    </div>
                                    
                                    <div className="p-4 bg-[#0A0A0A] border border-[#3F3F46] rounded-lg">
                                        <div className="text-xs text-[#808080] mb-1">Locations</div>
                                        <div className="text-2xl font-bold text-[#DC143C]">{parseResult.locations.size}</div>
                                    </div>
                                    
                                    <div className="p-4 bg-[#0A0A0A] border border-[#3F3F46] rounded-lg">
                                        <div className="text-xs text-[#808080] mb-1">Scenes</div>
                                        <div className="text-2xl font-bold text-[#DC143C]">{parseResult.scenes.length}</div>
                                    </div>
                                </div>
                                
                                {/* 🔥 NEW: Warning about destructive import */}
                                {showWarning && (
                                    <div className="mt-4 p-4 bg-[#DC143C]/10 border border-[#DC143C]/30 rounded-lg">
                                        <div className="flex items-start gap-3">
                                            <AlertTriangle className="w-6 h-6 text-[#DC143C] mt-0.5" />
                                            <div className="flex-1">
                                                <h3 className="font-bold text-lg text-[#FFFFFF]">⚠️ Warning: This will replace ALL existing data</h3>
                                                <div className="text-sm mt-1 text-[#808080]">
                                                    You currently have:
                                                    <ul className="list-disc list-inside mt-1 text-[#FFFFFF]">
                                                        {screenplay.characters.length > 0 && (
                                                            <li><strong>{screenplay.characters.length} characters</strong></li>
                                                        )}
                                                        {screenplay.locations.length > 0 && (
                                                            <li><strong>{screenplay.locations.length} locations</strong></li>
                                                        )}
                                                        {screenplay.scenes.length > 0 && (
                                                            <li><strong>{screenplay.scenes.length} scenes</strong></li>
                                                        )}
                                                        {editorContent && editorContent.trim().length > 0 && (
                                                            <li><strong>Screenplay content in editor</strong></li>
                                                        )}
                                                    </ul>
                                                    <p className="mt-2 text-[#FFFFFF]">
                                                        Importing this screenplay will <strong>DELETE ALL</strong> of your existing data and replace it with the new screenplay.
                                                    </p>
                                                </div>
                                                <div className="flex gap-2 mt-3">
                                                    <button 
                                                        onClick={() => setShowWarning(false)} 
                                                        className="px-4 py-2 bg-[#1F1F1F] hover:bg-[#2A2A2A] text-[#FFFFFF] rounded-lg text-sm font-medium transition-colors"
                                                        disabled={isImporting}
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button 
                                                        onClick={handleImport} 
                                                        className="px-4 py-2 bg-[#DC143C] hover:bg-[#DC143C]/90 text-white rounded-lg text-sm font-medium transition-colors"
                                                        disabled={isImporting}
                                                    >
                                                        {isImporting ? (
                                                            <>
                                                                <span className="loading loading-spinner loading-xs"></span>
                                                                Importing...
                                                            </>
                                                        ) : (
                                                            'Yes, Replace All Data'
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                {/* Warnings */}
                                {hasWarnings && (
                                    <div className="mt-4 p-4 bg-[#DC143C]/10 border border-[#DC143C]/30 rounded-lg">
                                        <div className="flex items-start gap-3">
                                            <AlertTriangle className="w-5 h-5 text-[#DC143C] mt-0.5" />
                                            <div className="flex-1">
                                                <div className="font-medium text-[#FFFFFF] mb-1">
                                                    {parseResult.questionableItems.length} formatting issue{parseResult.questionableItems.length !== 1 ? 's' : ''} detected
                                                </div>
                                                <div className="text-sm text-[#808080] mb-3">
                                                    These items will still be imported, but you may want to review them.
                                                </div>
                                                
                                                {/* List of issues */}
                                                <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                                                    {parseResult.questionableItems.map((item: any, index: number) => (
                                                        <div 
                                                            key={index} 
                                                            className="p-3 bg-[#0A0A0A] border border-[#3F3F46] rounded text-sm"
                                                        >
                                                            <div className="flex items-start justify-between gap-2 mb-1">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="px-2 py-0.5 bg-[#DC143C]/20 text-[#DC143C] rounded text-xs font-medium uppercase">
                                                                        {item.type}
                                                                    </span>
                                                                    <span className="text-[#808080] text-xs">
                                                                        Line {item.lineNumber}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="text-[#FFFFFF] font-mono text-xs mb-1 break-words">
                                                                "{item.text}"
                                                            </div>
                                                            <div className="text-[#808080] text-xs">
                                                                {item.reason}
                                                            </div>
                                                            {item.suggestion && (
                                                                <div className="mt-1 text-[#DC143C] text-xs">
                                                                    Suggestion: {item.suggestion}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {/* No data warning */}
                        {content.trim() && !hasData && !parseResult && (
                            <div className="p-4 bg-[#141414] border border-[#3F3F46] rounded-lg">
                                <span className="text-[#FFFFFF]">Parsing screenplay...</span>
                            </div>
                        )}
                        
                        {content.trim() && parseResult && !hasData && (
                            <div className="p-4 bg-[#141414] border border-[#DC143C]/30 rounded-lg">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-[#DC143C] mt-0.5" />
                                    <div>
                                        <div className="font-medium text-[#FFFFFF]">No entities detected</div>
                                        <div className="text-sm text-[#808080]">Make sure character names are in ALL CAPS and scene headings start with INT./EXT.</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 p-6 border-t border-[#3F3F46] bg-[#141414]">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-[#1F1F1F] hover:bg-[#2A2A2A] text-[#FFFFFF] rounded-lg text-sm font-medium transition-colors"
                            disabled={isImporting}
                        >
                            Cancel
                        </button>
                        
                        <button
                            onClick={handleImport}
                            className="px-4 py-2 bg-[#DC143C] hover:bg-[#DC143C]/90 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isImporting || !hasData}
                        >
                            {isImporting ? (
                                <>
                                    <span className="loading loading-spinner loading-sm"></span>
                                    Importing...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="w-5 h-5" />
                                    Import Screenplay
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

