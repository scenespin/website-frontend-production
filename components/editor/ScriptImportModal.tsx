'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useEditor } from '@/contexts/EditorContext';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { parseContentForImport } from '@/utils/fountainAutoImport';
import { updateScreenplay } from '@/utils/screenplayStorage';
import { toast } from 'sonner';
import { FileText, Upload, AlertTriangle, CheckCircle, X } from 'lucide-react';
import type { Character, Location, Scene } from '@/types/screenplay';

interface ScriptImportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ScriptImportModal({ isOpen, onClose }: ScriptImportModalProps) {
    const { getToken } = useAuth();
    const { setContent, saveNow } = useEditor();
    const screenplay = useScreenplay();
    
    const [content, setContentLocal] = useState('');
    const [isImporting, setIsImporting] = useState(false);
    const [parseResult, setParseResult] = useState<any>(null);
    const [showWarning, setShowWarning] = useState(false); // 🔥 NEW: Warning dialog state
    
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
        
        // 🔥 NEW: Check if user has existing data
        // Always clear on import to prevent duplicates (even if just default 8 beats exist)
        const hasExistingData = screenplay.characters.length > 0 
            || screenplay.locations.length > 0 
            || screenplay.beats.length > 0; // ANY beats means we need to clear first
        
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
                console.log('[ScriptImportModal] ⏳ Waiting for screenplay creation...');
                await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for ID to be set
                
                if (!screenplay.screenplayId) {
                    throw new Error('Failed to create screenplay - no ID available');
                }
                console.log('[ScriptImportModal] ✅ Screenplay created:', screenplay.screenplayId);
            }
            
            // 🔥 FIX: Step 1 - Clear CONTENT ONLY (preserve 8-beat structure)
            // 🔥 CRITICAL: Get fresh beats directly from return value, NOT from React state!
            let freshBeats: StoryBeat[] = [];
            if (hasExistingData) {
                console.log('[ScriptImportModal] Clearing existing content (preserving beat structure)...');
                freshBeats = await screenplay.clearContentOnly();
                console.log('[ScriptImportModal] ✅ Cleared content, received', freshBeats.length, 'fresh beats');
            } else {
                console.log('[ScriptImportModal] ⏭️ No existing data to clear, using current beats from state');
                freshBeats = screenplay.beats;
            }
            
            // Step 2: Set content in editor
            setContent(content);
            
            // Step 3: Import characters
            let importedCharacters: Character[] = [];
            if (parseResult.characters.size > 0) {
                const characterNames = Array.from(parseResult.characters) as string[];
                const characterDescriptions = parseResult.characterDescriptions || new Map<string, string>();
                importedCharacters = await screenplay.bulkImportCharacters(characterNames, characterDescriptions);
                console.log('[ScriptImportModal] ✅ Imported', characterNames.length, 'characters');
            }
            
            // Step 4: Import locations
            let importedLocations: Location[] = [];
            if (parseResult.locations.size > 0) {
                const locationNames = Array.from(parseResult.locations) as string[];
                importedLocations = await screenplay.bulkImportLocations(locationNames);
                console.log('[ScriptImportModal] ✅ Imported', locationNames.length, 'locations');
            }
            
            // Step 5: Build complete beat structure with scenes (NO STATE UPDATES)
            // 🔥 PROPER FIX: Build data structure first, THEN save in one operation
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
                        beatId: '', // Will be set when distributing to beats
                        number: globalIndex + 1,
                        heading: scene.heading,
                        synopsis: `Imported from script`,
                        status: 'draft' as const,
                        order: 0, // Will be set when distributing to beats
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
                
                // 🔥 Feature 0115: Distribute scenes to beats and assign beat_id + order
                // 🔥 CRITICAL: Use freshBeats (from clearContentOnly return value) instead of screenplay.beats (stale React state)
                const scenesPerBeat = Math.ceil(allScenes.length / freshBeats.length);
                const beatSceneDistribution: { beatId: string; beatTitle: string; beatDescription: string; order: number; scenes: Scene[] }[] = [];
                
                // Distribute scenes to beats
                freshBeats.forEach((beat, beatIndex) => {
                    const startIdx = beatIndex * scenesPerBeat;
                    const endIdx = Math.min(startIdx + scenesPerBeat, allScenes.length);
                    const scenesForThisBeat = allScenes.slice(startIdx, endIdx).map((scene, localIndex) => ({
                        ...scene,
                        beatId: beat.id,
                        order: localIndex
                    }));
                    
                    beatSceneDistribution.push({
                        beatId: beat.id,
                        beatTitle: beat.title,
                        beatDescription: beat.description,
                        order: beat.order,
                        scenes: scenesForThisBeat
                    });
                });
                
                console.log('[ScriptImportModal] ✅ Distributed scenes across beats:', beatSceneDistribution.map(d => ({
                    beatId: d.beatId,
                    scenesCount: d.scenes.length
                })));
                
                // 🔥 Feature 0115: CRITICAL - Save scenes to wryda-scenes table FIRST
                console.log('[ScriptImportModal] 💾 Saving scenes to wryda-scenes table...');
                if (screenplay.screenplayId) {
                    const flatScenes = beatSceneDistribution.flatMap(d => d.scenes);
                    await screenplay.saveScenes(flatScenes);  // ← Saves to wryda-scenes
                    console.log('[ScriptImportModal] ✅ Saved', flatScenes.length, 'scenes to wryda-scenes table');
                    
                    // 🔥 Feature 0115: THEN update beats with scene IDs (NOT full objects)
                    // 🔥 CRITICAL FIX: Build beats from beatSceneDistribution directly, NOT from stale React state!
                    // The screenplay.beats in state were just cleared by clearContentOnly() - they have empty scenes arrays!
                    console.log('[ScriptImportModal] 💾 Building beats directly from distribution (NOT from stale state)...');
                    const beatsWithSceneIds = beatSceneDistribution.map(distribution => ({
                        id: distribution.beatId,
                        title: distribution.beatTitle,
                        description: distribution.beatDescription,
                        order: distribution.order,
                        scenes: distribution.scenes,  // Full Scene objects for local state
                        createdAt: now,
                        updatedAt: now
                    }));
                    
                    // 🔥 CRITICAL FIX: Only save beats, NOT characters/locations!
                    // Characters and locations were already saved by bulkImportCharacters/bulkImportLocations above
                    // Saving them again would create duplicates in DynamoDB
                    console.log('[ScriptImportModal] 💾 Saving beats only (characters/locations already saved)...');
                    await screenplay.saveAllToDynamoDBDirect(
                        beatsWithSceneIds,
                        [], // Empty - already saved by bulkImportCharacters
                        [], // Empty - already saved by bulkImportLocations
                        screenplay.screenplayId
                    );
                    
                    console.log('[ScriptImportModal] ✅ Updated beats with scene IDs');
                } else {
                    throw new Error('No screenplay_id available for saving');
                }
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
            
            // Success toast
            toast.success('✅ Screenplay Imported', {
                description: `${parseResult.characters.size} characters, ${parseResult.locations.size} locations, ${parseResult.scenes.length} scenes`
            });
            
            // 🔥 CRITICAL: Reload page to fetch fresh data from DynamoDB
            // This ensures scenes are properly hydrated and visible immediately
            console.log('[ScriptImportModal] 🔄 Reloading page to fetch fresh data...');
            await new Promise(resolve => setTimeout(resolve, 1000)); // Show toast briefly before reload
            window.location.reload();
            
        } catch (error) {
            console.error('[ScriptImportModal] Import failed:', error);
            toast.error('❌ Import failed', {
                description: error instanceof Error ? error.message : 'Please try again'
            });
        } finally {
            setIsImporting(false);
        }
    }, [content, parseResult, setContent, screenplay, saveNow, onClose, showWarning]);
    
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
                                    
                                    {/* 🔥 NEW: Warning about destructive import */}
                                    {showWarning && (
                                        <div className="alert alert-error mt-4">
                                            <AlertTriangle className="w-6 h-6" />
                                            <div className="flex-1">
                                                <h3 className="font-bold text-lg">⚠️ Warning: This will replace ALL existing data</h3>
                                                <div className="text-sm mt-1">
                                                    You currently have:
                                                    <ul className="list-disc list-inside mt-1">
                                                        {screenplay.characters.length > 0 && (
                                                            <li><strong>{screenplay.characters.length} characters</strong></li>
                                                        )}
                                                        {screenplay.locations.length > 0 && (
                                                            <li><strong>{screenplay.locations.length} locations</strong></li>
                                                        )}
                                                        {screenplay.beats.length > 8 && (
                                                            <li><strong>{screenplay.beats.length} story beats</strong></li>
                                                        )}
                                                    </ul>
                                                    <p className="mt-2">
                                                        Importing this screenplay will <strong>DELETE ALL</strong> of your existing data and replace it with the new screenplay.
                                                    </p>
                                                </div>
                                                <div className="flex gap-2 mt-3">
                                                    <button 
                                                        onClick={() => setShowWarning(false)} 
                                                        className="btn btn-sm btn-ghost"
                                                        disabled={isImporting}
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button 
                                                        onClick={handleImport} 
                                                        className="btn btn-sm btn-error"
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
                                    )}
                                    
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

