'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useEditor } from '@/contexts/EditorContext';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { parseContentForImport } from '@/utils/fountainAutoImport';
import { updateScreenplay } from '@/utils/screenplayStorage';
import { fixCharacterEncoding, addBasicFountainSpacing } from '@/utils/screenplayNormalizer';
import { toast } from 'sonner';
import { FileText, Upload, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { extractTextFromPDF, isPDFFile } from '@/utils/pdfTextExtractor';
import { extractTextFromWord, isWordFile } from '@/utils/wordTextExtractor';
import { extractTextFromFDX, isFDXFile } from '@/utils/fdxTextExtractor';

interface ScriptImportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ScriptImportModal({ isOpen, onClose }: ScriptImportModalProps) {
    const { getToken } = useAuth();
    const { setContent, saveNow, state: editorState } = useEditor();
    const editorContent = editorState.content;
    const screenplay = useScreenplay();
    
    const [content, setContentLocal] = useState('');
    const [isImporting, setIsImporting] = useState(false);
    const [isPostImportRescanning, setIsPostImportRescanning] = useState(false);
    const [parseResult, setParseResult] = useState<any>(null);
    const [showWarning, setShowWarning] = useState(false); // 🔥 NEW: Warning dialog state
    const [isExtractingPDF, setIsExtractingPDF] = useState(false); // 🔥 NEW: PDF extraction state
    const [isExtractingWord, setIsExtractingWord] = useState(false); // 🔥 NEW: Word extraction state
    const [isExtractingFDX, setIsExtractingFDX] = useState(false); // 🔥 NEW: FDX extraction state
    const [isExtractingFountain, setIsExtractingFountain] = useState(false); // 🔥 NEW: Fountain extraction state
    const [uploadedFileName, setUploadedFileName] = useState<string | null>(null); // 🔥 NEW: Track uploaded file name
    const [uploadedFileType, setUploadedFileType] = useState<'pdf' | 'word' | 'fdx' | 'fountain' | null>(null);
    const [fdxInteropPayload, setFdxInteropPayload] = useState<{
        schemaVersion: number;
        sourceVersion?: string;
        rawXml: string;
        preservedNodes: Record<string, string>;
        paragraphAttributeIndex: Record<string, { attrs: Record<string, string>; normalizedTextHash: string }>;
    } | null>(null);
    const [selectedTimeOfDay, setSelectedTimeOfDay] = useState<Record<number, string>>({}); // 🔥 NEW: Track selected time of day for each scene heading issue
    
    // Reset all state when modal closes
    useEffect(() => {
        if (!isOpen) {
            setContentLocal('');
            setParseResult(null);
            setShowWarning(false);
            setIsExtractingPDF(false);
            setIsExtractingWord(false);
            setIsExtractingFDX(false);
            setIsExtractingFountain(false);
            setIsImporting(false);
            setIsPostImportRescanning(false);
            setUploadedFileName(null);
            setUploadedFileType(null);
            setFdxInteropPayload(null);
            setSelectedTimeOfDay({});
        }
    }, [isOpen]);
    
    // Parse content whenever it changes (debounced)
    // Feature 0177: Normalize content before parsing
    useEffect(() => {
        if (!content.trim()) {
            setParseResult(null);
            return;
        }
        
        const timer = setTimeout(async () => {
            try {
                let processedContent = content;
                // Always fix character encoding issues (safe for all sources)
                // This handles UTF-8 corruption from PDF extraction, copy-paste, etc.
                processedContent = fixCharacterEncoding(processedContent);
                
                // Add basic Fountain spacing for extracted formats.
                // Skip this for native Fountain uploads to preserve author formatting.
                if (uploadedFileType !== 'fountain') {
                    processedContent = addBasicFountainSpacing(processedContent);
                }
                
                // Parse the content (no additional normalization for PDF/Word/clean Fountain)
                const result = parseContentForImport(processedContent);
                setParseResult(result);
            } catch (error) {
                console.error('[ScriptImportModal] Parse error:', error);
            }
        }, 500); // Debounce 500ms
        
        return () => clearTimeout(timer);
    }, [content, uploadedFileType]);
    
    const isFountainFile = (file: File): boolean => {
        const extension = file.name.toLowerCase().split('.').pop();
        const mimeType = file.type.toLowerCase();
        return extension === 'fountain' || mimeType === 'text/plain';
    };
    
    // 🔥 NEW: Handle file upload (PDF, Word, FDX, or Fountain)
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
            // Reset state for new file
            setContentLocal('');
            setParseResult(null);
            
            setIsExtractingPDF(true);
            setUploadedFileName(file.name);
            setUploadedFileType('pdf');
            
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
                setUploadedFileType(null);
            } finally {
                setIsExtractingPDF(false);
                event.target.value = '';
            }
        } else if (isWordFile(file)) {
            // Reset state for new file
            setContentLocal('');
            setParseResult(null);
            
            setIsExtractingWord(true);
            setUploadedFileName(file.name);
            setUploadedFileType('word');
            
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
                setUploadedFileType(null);
            } finally {
                setIsExtractingWord(false);
                event.target.value = '';
            }
        } else if (isFDXFile(file)) {
            // Reset state for new file
            setContentLocal('');
            setParseResult(null);
            
            setIsExtractingFDX(true);
            setUploadedFileName(file.name);
            setUploadedFileType('fdx');
            
            try {
                toast.info('Extracting text from Final Draft file...', { duration: 2000 });
                
                const result = await extractTextFromFDX(file);
                
                if (!result.success) {
                    throw new Error(result.error || 'Failed to extract text from FDX file');
                }
                
                if (!result.text.trim()) {
                    throw new Error('FDX file appears to be empty or contains no extractable text');
                }
                
                // Set extracted text as content (will trigger parsing via useEffect)
                setContentLocal(result.text);
                setFdxInteropPayload(result.fdxInterop || null);
                
                toast.success('✅ Final Draft file extracted successfully', {
                    description: 'Review the preview below and click Import when ready'
                });
                
            } catch (error) {
                console.error('[ScriptImportModal] FDX extraction error:', error);
                toast.error('Failed to extract text from FDX file', {
                    description: error instanceof Error ? error.message : 'Please try another FDX file'
                });
                setUploadedFileName(null);
                setUploadedFileType(null);
                setFdxInteropPayload(null);
            } finally {
                setIsExtractingFDX(false);
                event.target.value = '';
            }
        } else if (isFountainFile(file)) {
            setContentLocal('');
            setParseResult(null);
            
            setIsExtractingFountain(true);
            setUploadedFileName(file.name);
            setUploadedFileType('fountain');
            
            try {
                const text = await file.text();
                
                if (!text.trim()) {
                    throw new Error('Fountain file appears to be empty');
                }
                
                setContentLocal(text);
                toast.success('✅ Fountain file loaded successfully', {
                    description: 'Review the preview below, then import when ready'
                });
            } catch (error) {
                console.error('[ScriptImportModal] Fountain file read error:', error);
                toast.error('Failed to read Fountain file', {
                    description: error instanceof Error ? error.message : 'Please try another Fountain file'
                });
                setUploadedFileName(null);
                setUploadedFileType(null);
            } finally {
                setIsExtractingFountain(false);
                event.target.value = '';
            }
        } else {
            toast.error('Please select a PDF, Word (.docx), Final Draft (.fdx), or Fountain (.fountain) file');
            return;
        }
    }, []);
    
    const handleImport = useCallback(async (rescanAfterImport: boolean, skipWarning = false) => {
        if (!content.trim()) {
            toast.error('Please upload a screenplay file first');
            return;
        }
        
        if (!parseResult) {
            toast.error('Parsing screenplay...');
            return;
        }
        
        // Optional: show informational note when user has existing data (script-only import)
        const hasExistingData = screenplay.characters.length > 0 
            || screenplay.locations.length > 0 
            || screenplay.scenes.length > 0
            || (editorContent && editorContent.trim().length > 0);
        
        if (hasExistingData && !showWarning && !skipWarning) {
            setShowWarning(true);
            return;
        }
        
        setIsImporting(true);
        setIsPostImportRescanning(false);
        let importCompleted = false;
        
        try {
            console.log('[ScriptImportModal] Importing script...');
            
            // Apply time of day corrections to scene headings
            let correctedContent = content;
            if (parseResult.questionableItems && Object.keys(selectedTimeOfDay).length > 0) {
                const lines = correctedContent.split('\n');
                parseResult.questionableItems.forEach((item: any, index: number) => {
                    if (item.type === 'scene_heading' && item.reason.includes('time of day')) {
                        const timeOfDay = selectedTimeOfDay[index] || 'DAY';
                        const lineIndex = item.lineNumber - 1;
                        if (lineIndex >= 0 && lineIndex < lines.length) {
                            lines[lineIndex] = item.text + ' - ' + timeOfDay;
                        }
                    }
                });
                correctedContent = lines.join('\n');
            }
            
            // Remove camera direction lines from script text (replace with blank line)
            if (parseResult.scenes) {
                const lines = correctedContent.split('\n');
                const cameraDirectionsToRemove = new Set<string>();
                parseResult.scenes.forEach((scene: any) => {
                    if (scene.cameraDirections?.length > 0) {
                        scene.cameraDirections.forEach((cameraDir: string) => {
                            cameraDirectionsToRemove.add(cameraDir.trim().toUpperCase());
                        });
                    }
                });
                if (cameraDirectionsToRemove.size > 0) {
                    for (let i = 0; i < lines.length; i++) {
                        if (cameraDirectionsToRemove.has(lines[i].trim().toUpperCase())) {
                            lines[i] = '';
                        }
                    }
                }
                correctedContent = lines.join('\n');
            }
            
            let processedContent = correctedContent;
            processedContent = fixCharacterEncoding(processedContent);
            if (uploadedFileType !== 'fountain') {
                processedContent = addBasicFountainSpacing(processedContent);
            }
            
            // Only overwrite editor content; do not touch characters, locations, scenes, or media
            setContent(processedContent);
            
            if (!screenplay.screenplayId) {
                await saveNow();
            }
            
            localStorage.setItem('screenplay_draft', processedContent);
            if (screenplay.screenplayId) {
                await updateScreenplay({
                    screenplay_id: screenplay.screenplayId,
                    content: processedContent
                }, getToken);
            }

            // Phase 3 FDX fidelity: store import sidecar + original XML pointer source payload.
            if (uploadedFileType === 'fdx' && fdxInteropPayload) {
                const activeScreenplayId =
                    screenplay.screenplayId ||
                    localStorage.getItem('current_screenplay_id') ||
                    null;
                if (activeScreenplayId) {
                    await updateScreenplay({
                        screenplay_id: activeScreenplayId,
                        fdxInteropImport: fdxInteropPayload,
                    }, getToken);
                } else {
                    console.warn('[ScriptImportModal] FDX interop payload captured but screenplay_id not available yet');
                }
            }
            importCompleted = true;
            
            if (rescanAfterImport) {
                setIsPostImportRescanning(true);
                const rescanResult = await screenplay.rescanScript(processedContent);
                toast.success('Import + rescan complete', {
                    description: `Added ${rescanResult.newCharacters} characters, ${rescanResult.newLocations} locations, and ${rescanResult.newScenes} scenes.`
                });
            } else {
                toast.success('Script imported', {
                    description: 'Import only mode completed. Use Rescan when you are ready to update characters, locations, and scenes.'
                });
            }
            
            onClose();
            
        } catch (error) {
            console.error('[ScriptImportModal] Import failed:', error);
            const shouldShowRescanFailureMessage = rescanAfterImport && importCompleted;
            toast.error(shouldShowRescanFailureMessage ? 'Import completed, but rescan failed' : 'Import failed', {
                description: error instanceof Error ? error.message : 'Please try again'
            });
        } finally {
            setIsImporting(false);
            setIsPostImportRescanning(false);
        }
    }, [content, parseResult, setContent, screenplay, saveNow, onClose, showWarning, editorContent, selectedTimeOfDay, uploadedFileType, fdxInteropPayload, getToken]);
    
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
                                <span className="text-[#FFFFFF] text-sm">Upload screenplay files (PDF, Word, Final Draft, or Fountain). Import replaces script text. The recommended action is Import + Rescan to update characters, locations, and scenes in one step.</span>
                            </div>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block mb-2">
                                    <span className="text-sm font-medium text-[#FFFFFF]">Upload screenplay file</span>
                                </label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="file"
                                        accept=".pdf,application/pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.fdx,application/xml,text/xml,.fountain,text/plain"
                                        onChange={handleFileUpload}
                                        disabled={isImporting || isExtractingPDF || isExtractingWord || isExtractingFDX || isExtractingFountain}
                                        className="file-input w-full max-w-xs bg-[#1F1F1F] border-[#3F3F46] text-[#FFFFFF] file:bg-[#DC143C] file:text-white file:border-0 file:rounded file:px-4 file:py-2 file:cursor-pointer hover:file:bg-[#DC143C]/90"
                                    />
                                    {(isExtractingPDF || isExtractingWord || isExtractingFDX || isExtractingFountain) && (
                                        <div className="flex items-center gap-2 text-sm text-[#808080]">
                                            <span className="loading loading-spinner loading-sm"></span>
                                            <span>
                                                {isExtractingPDF && 'Extracting text from PDF...'}
                                                {isExtractingWord && 'Extracting text from Word document...'}
                                                {isExtractingFDX && 'Extracting text from Final Draft file...'}
                                                {isExtractingFountain && 'Reading Fountain file...'}
                                            </span>
                                        </div>
                                    )}
                                    {uploadedFileName && !isExtractingPDF && !isExtractingWord && !isExtractingFDX && !isExtractingFountain && (
                                        <div className="flex items-center gap-2 text-sm text-[#DC143C]">
                                            <CheckCircle className="w-4 h-4" />
                                            <span className="text-[#FFFFFF]">{uploadedFileName}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="mt-2">
                                    <span className="text-xs text-[#808080]">
                                        Supports PDF, Word (.docx), Final Draft (.fdx), and Fountain (.fountain) files.
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
                        </div>
                        
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
                                
                                {/* Info when user has existing data: import only replaces script */}
                                {showWarning && (
                                    <div className="mt-4 p-4 bg-[#3B82F6]/10 border border-[#3B82F6]/30 rounded-lg">
                                        <div className="flex items-start gap-3">
                                            <AlertTriangle className="w-6 h-6 text-[#3B82F6] mt-0.5" />
                                            <div className="flex-1">
                                                <h3 className="font-bold text-lg text-[#FFFFFF]">Replace script only</h3>
                                                <div className="text-sm mt-1 text-[#808080]">
                                                    You have existing data. Import will replace <strong>only the script text</strong> in the editor.
                                                    <ul className="list-disc list-inside mt-1 text-[#FFFFFF]">
                                                        {screenplay.characters.length > 0 && (
                                                            <li><strong>{screenplay.characters.length} characters</strong> — kept</li>
                                                        )}
                                                        {screenplay.locations.length > 0 && (
                                                            <li><strong>{screenplay.locations.length} locations</strong> — kept</li>
                                                        )}
                                                        {screenplay.scenes.length > 0 && (
                                                            <li><strong>{screenplay.scenes.length} scenes</strong> — kept</li>
                                                        )}
                                                        {editorContent && editorContent.trim().length > 0 && (
                                                            <li>Current script — will be replaced</li>
                                                        )}
                                                    </ul>
                                                    <p className="mt-2 text-[#FFFFFF]">
                                                        Recommended: use <strong>Import + Rescan</strong> to update entities immediately. Use <strong>Import only</strong> for very large scripts or when you want to clean formatting before rescanning.
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
                                                        onClick={() => handleImport(false, true)} 
                                                        className="px-4 py-2 bg-[#1F1F1F] hover:bg-[#2A2A2A] text-[#FFFFFF] rounded-lg text-sm font-medium transition-colors"
                                                        disabled={isImporting}
                                                    >
                                                        {isImporting && !isPostImportRescanning ? (
                                                            <>
                                                                <span className="loading loading-spinner loading-xs"></span>
                                                                Importing...
                                                            </>
                                                        ) : (
                                                            'Import only (advanced)'
                                                        )}
                                                    </button>
                                                    <button 
                                                        onClick={() => handleImport(true, true)} 
                                                        className="px-4 py-2 bg-[#3B82F6] hover:bg-[#3B82F6]/90 text-white rounded-lg text-sm font-medium transition-colors"
                                                        disabled={isImporting}
                                                    >
                                                        {isImporting ? (
                                                            <>
                                                                <span className="loading loading-spinner loading-xs"></span>
                                                                {isPostImportRescanning ? 'Rescanning...' : 'Importing...'}
                                                            </>
                                                        ) : (
                                                            'Import + Rescan (recommended)'
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
                                                            <div className="text-[#808080] text-xs mb-2">
                                                                {item.reason}
                                                            </div>
                                                            
                                                            {/* Time of day dropdown for scene headings */}
                                                            {item.type === 'scene_heading' && item.reason.includes('time of day') && (
                                                                <div className="mt-2">
                                                                    <label className="text-xs text-[#808080] mb-1 block">Select time of day:</label>
                                                                    <select
                                                                        value={selectedTimeOfDay[index] || 'DAY'}
                                                                        onChange={(e) => {
                                                                            setSelectedTimeOfDay(prev => ({
                                                                                ...prev,
                                                                                [index]: e.target.value
                                                                            }));
                                                                        }}
                                                                        className="w-full px-3 py-1.5 bg-[#141414] border border-[#3F3F46] rounded text-[#FFFFFF] text-sm focus:outline-none focus:ring-2 focus:ring-[#DC143C] focus:border-transparent"
                                                                    >
                                                                        <option value="DAY">DAY</option>
                                                                        <option value="NIGHT">NIGHT</option>
                                                                        <option value="DAWN">DAWN</option>
                                                                        <option value="DUSK">DUSK</option>
                                                                        <option value="MORNING">MORNING</option>
                                                                        <option value="AFTERNOON">AFTERNOON</option>
                                                                        <option value="EVENING">EVENING</option>
                                                                        <option value="LATER">LATER</option>
                                                                        <option value="CONTINUOUS">CONTINUOUS</option>
                                                                        <option value="SAME">SAME</option>
                                                                    </select>
                                                                    <div className="mt-1 text-xs text-[#808080]">
                                                                        Will update to: {item.text} - {selectedTimeOfDay[index] || 'DAY'}
                                                                    </div>
                                                                </div>
                                                            )}
                                                            
                                                            {item.suggestion && item.type !== 'scene_heading' && (
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

                        <div className="p-4 bg-[#141414] border border-[#3F3F46] rounded-lg">
                            <p className="text-xs text-[#808080]">
                                <strong className="text-[#FFFFFF]">Import + Rescan</strong> is recommended for most users and updates entities right away.
                                Use <strong className="text-[#FFFFFF]">Import only</strong> for very large scripts or when you want to clean and verify imported formatting before rescanning.
                            </p>
                        </div>
                        
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
                            onClick={() => handleImport(false)}
                            className="px-4 py-2 bg-[#1F1F1F] hover:bg-[#2A2A2A] text-[#FFFFFF] rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isImporting || !hasData}
                        >
                            {isImporting && !isPostImportRescanning ? (
                                <>
                                    <span className="loading loading-spinner loading-sm"></span>
                                    Importing...
                                </>
                            ) : (
                                <>
                                    Import only
                                </>
                            )}
                        </button>

                        <button
                            onClick={() => handleImport(true)}
                            className="px-4 py-2 bg-[#DC143C] hover:bg-[#DC143C]/90 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isImporting || !hasData}
                        >
                            {isImporting ? (
                                <>
                                    <span className="loading loading-spinner loading-sm"></span>
                                    {isPostImportRescanning ? 'Rescanning...' : 'Importing...'}
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="w-5 h-5" />
                                    Import + Rescan
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

