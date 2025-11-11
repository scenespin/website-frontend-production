'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useEditor } from '@/contexts/EditorContext';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { parseContentForImport } from '@/utils/fountainAutoImport';
import { toast } from 'sonner';
import { FileText, Upload, AlertTriangle, CheckCircle, X } from 'lucide-react';

interface ScriptImportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ScriptImportModal({ isOpen, onClose }: ScriptImportModalProps) {
    const { setContent, saveNow } = useEditor();
    const screenplay = useScreenplay();
    
    const [content, setContentLocal] = useState('');
    const [isImporting, setIsImporting] = useState(false);
    const [parseResult, setParseResult] = useState<any>(null);
    
    // Parse content whenever it changes (debounced)
    useEffect(() => {
        if (!content.trim()) {
            setParseResult(null);
            return;
        }
        
        const timer = setTimeout(() => {
            try {
                const result = parseContentForImport(content);
                setParseResult(result);
            } catch (error) {
                console.error('[ScriptImportModal] Parse error:', error);
            }
        }, 500); // Debounce 500ms
        
        return () => clearTimeout(timer);
    }, [content]);
    
    const handleImport = useCallback(async () => {
        if (!content.trim()) {
            toast.error('Please paste a screenplay first');
            return;
        }
        
        if (!parseResult) {
            toast.error('Parsing screenplay...');
            return;
        }
        
        setIsImporting(true);
        
        try {
            console.log('[ScriptImportModal] Starting import...', {
                characters: parseResult.characters.size,
                locations: parseResult.locations.size,
                scenes: parseResult.scenes.length
            });
            
            // Step 1: Set content in editor
            setContent(content);
            
            // Step 2: Import characters
            if (parseResult.characters.size > 0) {
                const characterNames = Array.from(parseResult.characters);
                const characterDescriptions = parseResult.characterDescriptions || new Map();
                await screenplay.bulkImportCharacters(characterNames, characterDescriptions);
                console.log('[ScriptImportModal] ✅ Imported', characterNames.length, 'characters');
            }
            
            // Step 3: Import locations
            if (parseResult.locations.size > 0) {
                const locationNames = Array.from(parseResult.locations);
                await screenplay.bulkImportLocations(locationNames);
                console.log('[ScriptImportModal] ✅ Imported', locationNames.length, 'locations');
            }
            
            // Step 4: Import scenes into beats
            if (parseResult.scenes.length > 0 && screenplay.beats.length > 0) {
                // Distribute scenes across existing beats
                const scenesPerBeat = Math.ceil(parseResult.scenes.length / screenplay.beats.length);
                
                for (let i = 0; i < screenplay.beats.length; i++) {
                    const beat = screenplay.beats[i];
                    const startIdx = i * scenesPerBeat;
                    const endIdx = Math.min(startIdx + scenesPerBeat, parseResult.scenes.length);
                    const scenesForBeat = parseResult.scenes.slice(startIdx, endIdx);
                    
                    if (scenesForBeat.length > 0) {
                        await screenplay.bulkImportScenes(beat.id, scenesForBeat);
                    }
                }
                
                console.log('[ScriptImportModal] ✅ Imported', parseResult.scenes.length, 'scenes');
            }
            
            // Step 5: Save everything to DynamoDB
            console.log('[ScriptImportModal] 💾 Saving to DynamoDB...');
            await saveNow();
            
            // Success!
            toast.success('✅ Screenplay Imported', {
                description: `${parseResult.characters.size} characters, ${parseResult.locations.size} locations, ${parseResult.scenes.length} scenes`
            });
            
            // Close modal
            onClose();
            
        } catch (error) {
            console.error('[ScriptImportModal] Import failed:', error);
            toast.error('❌ Import failed', {
                description: error instanceof Error ? error.message : 'Please try again'
            });
        } finally {
            setIsImporting(false);
        }
    }, [content, parseResult, setContent, screenplay, saveNow, onClose]);
    
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
                className="fixed inset-0 bg-black/50 z-50"
                onClick={onClose}
            />
            
            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                <div 
                    className="bg-base-100 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col pointer-events-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-base-300">
                        <div className="flex items-center gap-3">
                            <FileText className="w-6 h-6 text-cinema-red" />
                            <h2 className="text-2xl font-bold">Import Screenplay</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="btn btn-ghost btn-sm btn-circle"
                            disabled={isImporting}
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* Instructions */}
                        <div className="alert alert-info">
                            <Upload className="w-5 h-5" />
                            <span>Paste your screenplay in Fountain format below. We'll automatically detect characters, locations, and scenes.</span>
                        </div>
                        
                        {/* Textarea */}
                        <div>
                            <label className="label">
                                <span className="label-text font-medium">Screenplay Content</span>
                            </label>
                            <textarea
                                className="textarea textarea-bordered w-full h-64 font-mono text-sm"
                                placeholder="Paste your screenplay here..."
                                value={content}
                                onChange={(e) => setContentLocal(e.target.value)}
                                disabled={isImporting}
                            />
                        </div>
                        
                        {/* Preview Panel */}
                        {hasData && (
                            <div className="card bg-base-200">
                                <div className="card-body">
                                    <h3 className="card-title text-lg">Preview</h3>
                                    
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="stat bg-base-100 rounded-lg">
                                            <div className="stat-title">Characters</div>
                                            <div className="stat-value text-cinema-red">{parseResult.characters.size}</div>
                                        </div>
                                        
                                        <div className="stat bg-base-100 rounded-lg">
                                            <div className="stat-title">Locations</div>
                                            <div className="stat-value text-cinema-red">{parseResult.locations.size}</div>
                                        </div>
                                        
                                        <div className="stat bg-base-100 rounded-lg">
                                            <div className="stat-title">Scenes</div>
                                            <div className="stat-value text-cinema-red">{parseResult.scenes.length}</div>
                                        </div>
                                    </div>
                                    
                                    {/* Warnings */}
                                    {hasWarnings && (
                                        <div className="alert alert-warning mt-4">
                                            <AlertTriangle className="w-5 h-5" />
                                            <div>
                                                <div className="font-medium">{parseResult.questionableItems.length} formatting issues detected</div>
                                                <div className="text-sm">These items will still be imported, but you may want to review them.</div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        
                        {/* No data warning */}
                        {content.trim() && !hasData && !parseResult && (
                            <div className="alert">
                                <span>Parsing screenplay...</span>
                            </div>
                        )}
                        
                        {content.trim() && parseResult && !hasData && (
                            <div className="alert alert-warning">
                                <AlertTriangle className="w-5 h-5" />
                                <div>
                                    <div className="font-medium">No entities detected</div>
                                    <div className="text-sm">Make sure character names are in ALL CAPS and scene headings start with INT./EXT.</div>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 p-6 border-t border-base-300">
                        <button
                            onClick={onClose}
                            className="btn btn-ghost"
                            disabled={isImporting}
                        >
                            Cancel
                        </button>
                        
                        <button
                            onClick={handleImport}
                            className="btn btn-primary"
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

