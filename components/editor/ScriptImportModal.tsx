'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useEditor } from '@/contexts/EditorContext';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { parseContentForImport } from '@/utils/fountainAutoImport';
import { updateScreenplay } from '@/utils/screenplayStorage';
import { normalizeScreenplayText, cleanWebPastedText, fixCharacterEncoding, addBasicFountainSpacing } from '@/utils/screenplayNormalizer';
import { processChunkedImport } from '@/utils/screenplayStreamParser';
import { toast } from 'sonner';
import { FileText, Upload, AlertTriangle, CheckCircle, X, File } from 'lucide-react';
import { extractTextFromPDF, isPDFFile } from '@/utils/pdfTextExtractor';
import { extractTextFromWord, isWordFile } from '@/utils/wordTextExtractor';
import { extractTextFromFDX, isFDXFile } from '@/utils/fdxTextExtractor';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

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
    const [parseResult, setParseResult] = useState<any>(null);
    const [showWarning, setShowWarning] = useState(false); // 🔥 NEW: Warning dialog state
    const [normalizationProgress, setNormalizationProgress] = useState<number | null>(null); // Feature 0177: Progress for large files
    const [isExtractingPDF, setIsExtractingPDF] = useState(false); // 🔥 NEW: PDF extraction state
    const [isExtractingWord, setIsExtractingWord] = useState(false); // 🔥 NEW: Word extraction state
    const [isExtractingFDX, setIsExtractingFDX] = useState(false); // 🔥 NEW: FDX extraction state
    const [uploadedFileName, setUploadedFileName] = useState<string | null>(null); // 🔥 NEW: Track uploaded file name
    const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload'); // 🔥 NEW: Tab state
    const [selectedTimeOfDay, setSelectedTimeOfDay] = useState<Record<number, string>>({}); // 🔥 NEW: Track selected time of day for each scene heading issue
    const [enableWebCleaning, setEnableWebCleaning] = useState(false); // Feature 0197: Opt-in web paste cleaning
    
    // Reset all state when modal closes
    useEffect(() => {
        if (!isOpen) {
            setContentLocal('');
            setParseResult(null);
            setShowWarning(false);
            setNormalizationProgress(null);
            setIsExtractingPDF(false);
            setIsExtractingWord(false);
            setIsExtractingFDX(false);
            setUploadedFileName(null);
            setSelectedTimeOfDay({});
        }
    }, [isOpen]);
    
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
                // Feature 0197: Apply web cleaning if enabled (paste tab only)
                let processedContent = content;
                if (enableWebCleaning && activeTab === 'paste') {
                    processedContent = cleanWebPastedText(content);
                }
                
                // Always fix character encoding issues (safe for all sources)
                // This handles UTF-8 corruption from PDF extraction, copy-paste, etc.
                processedContent = fixCharacterEncoding(processedContent);
                
                // Add basic Fountain spacing for PDF/Word imports (they lack blank lines)
                // Only applies to upload tab (PDF/Word), not paste tab (already has spacing)
                if (activeTab === 'upload') {
                    processedContent = addBasicFountainSpacing(processedContent);
                }
                
                // Parse the content (no additional normalization for PDF/Word/clean Fountain)
                const result = parseContentForImport(processedContent);
                setParseResult(result);
            } catch (error) {
                console.error('[ScriptImportModal] Parse error:', error);
                setNormalizationProgress(null);
            }
        }, 500); // Debounce 500ms
        
        return () => clearTimeout(timer);
    }, [content, enableWebCleaning, activeTab]);
    
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
            // Reset state for new file
            setContentLocal('');
            setParseResult(null);
            
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
            // Reset state for new file
            setContentLocal('');
            setParseResult(null);
            
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
        } else if (isFDXFile(file)) {
            // Reset state for new file
            setContentLocal('');
            setParseResult(null);
            
            setIsExtractingFDX(true);
            setUploadedFileName(file.name);
            
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
                
                toast.success('✅ Final Draft file extracted successfully', {
                    description: 'Review the preview below and click Import when ready'
                });
                
            } catch (error) {
                console.error('[ScriptImportModal] FDX extraction error:', error);
                toast.error('Failed to extract text from FDX file', {
                    description: error instanceof Error ? error.message : 'Please try another FDX file'
                });
                setUploadedFileName(null);
            } finally {
                setIsExtractingFDX(false);
                event.target.value = '';
            }
        } else {
            toast.error('Please select a PDF, Word (.docx), or Final Draft (.fdx) file');
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
        
        // Optional: show informational note when user has existing data (script-only import)
        const hasExistingData = screenplay.characters.length > 0 
            || screenplay.locations.length > 0 
            || screenplay.scenes.length > 0
            || (editorContent && editorContent.trim().length > 0);
        
        if (hasExistingData && !showWarning) {
            setShowWarning(true);
            return;
        }
        
        setIsImporting(true);
        
        try {
            console.log('[ScriptImportModal] Import script only (non-destructive)...');
            
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
            if (enableWebCleaning && activeTab === 'paste') {
                processedContent = cleanWebPastedText(correctedContent);
            }
            processedContent = fixCharacterEncoding(processedContent);
            processedContent = addBasicFountainSpacing(processedContent);
            
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
            
            toast.success('Script updated', {
                description: 'Use Rescan in the toolbar to add new characters/locations from the script. Your boards and media are unchanged.'
            });
            onClose();
            
        } catch (error) {
            console.error('[ScriptImportModal] Import failed:', error);
            toast.error('Import failed', {
                description: error instanceof Error ? error.message : 'Please try again'
            });
        } finally {
            setIsImporting(false);
        }
    }, [content, parseResult, setContent, screenplay, saveNow, onClose, showWarning, editorContent, enableWebCleaning, activeTab, selectedTimeOfDay]);
    
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
                                <span className="text-[#FFFFFF] text-sm">Upload a PDF, Word document, or Final Draft (.fdx) file, or paste your screenplay in Fountain format. We'll automatically detect characters, locations, and scenes.</span>
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
                                        <span className="text-sm font-medium text-[#FFFFFF]">Upload PDF, Word, or Final Draft File</span>
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="file"
                                            accept=".pdf,application/pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.fdx,application/xml,text/xml"
                                            onChange={handleFileUpload}
                                            disabled={isImporting || isExtractingPDF || isExtractingWord || isExtractingFDX}
                                            className="file-input w-full max-w-xs bg-[#1F1F1F] border-[#3F3F46] text-[#FFFFFF] file:bg-[#DC143C] file:text-white file:border-0 file:rounded file:px-4 file:py-2 file:cursor-pointer hover:file:bg-[#DC143C]/90"
                                        />
                                        {(isExtractingPDF || isExtractingWord || isExtractingFDX) && (
                                            <div className="flex items-center gap-2 text-sm text-[#808080]">
                                                <span className="loading loading-spinner loading-sm"></span>
                                                <span>
                                                    {isExtractingPDF && 'Extracting text from PDF...'}
                                                    {isExtractingWord && 'Extracting text from Word document...'}
                                                    {isExtractingFDX && 'Extracting text from Final Draft file...'}
                                                </span>
                                            </div>
                                        )}
                                        {uploadedFileName && !isExtractingPDF && !isExtractingWord && !isExtractingFDX && (
                                            <div className="flex items-center gap-2 text-sm text-[#DC143C]">
                                                <CheckCircle className="w-4 h-4" />
                                                <span className="text-[#FFFFFF]">{uploadedFileName}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-2">
                                        <span className="text-xs text-[#808080]">
                                            Supports PDF, Word (.docx), and Final Draft (.fdx) files. Files will be automatically converted to Fountain format.
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
                                    
                                    {/* Feature 0197: Web paste cleaning checkbox */}
                                    <div className="mt-4">
                                        <label className="label cursor-pointer gap-2">
                                            <input
                                                type="checkbox"
                                                checked={enableWebCleaning}
                                                onChange={(e) => setEnableWebCleaning(e.target.checked)}
                                                className="checkbox checkbox-sm bg-[#1F1F1F] border-[#3F3F46] checked:bg-[#DC143C] checked:border-[#DC143C]"
                                            />
                                            <div className="flex flex-col gap-1">
                                                <span className="label-text text-sm text-[#FFFFFF]">
                                                    Clean web-pasted content (for imports from websites or imperfect sources)
                                                </span>
                                                <span className="label-text text-xs text-[#808080]">
                                                    Note: This may not work perfectly for all content. Manual cleanup may still be required.
                                                    Perfect Fountain format is always recommended for best results.
                                                </span>
                                            </div>
                                        </label>
                                    </div>
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
                                                        Use <strong>Rescan</strong> in the toolbar after import to add new characters/locations from the script. Your boards and media are not deleted.
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
                                                        className="px-4 py-2 bg-[#3B82F6] hover:bg-[#3B82F6]/90 text-white rounded-lg text-sm font-medium transition-colors"
                                                        disabled={isImporting}
                                                    >
                                                        {isImporting ? (
                                                            <>
                                                                <span className="loading loading-spinner loading-xs"></span>
                                                                Importing...
                                                            </>
                                                        ) : (
                                                            'Replace script only'
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

