'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, MoreVertical, User, Users, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { useAuth } from '@clerk/nextjs';
import { useEditor } from '@/contexts/EditorContext';
import { useQueryClient } from '@tanstack/react-query';
import type { Character, ArcStatus } from '@/types/screenplay';
import CharacterDetailSidebar from './CharacterDetailSidebar';
import { DeleteCharacterDialog } from '../structure/DeleteConfirmDialog';
import { getCharacterDependencies, generateCharacterReport } from '@/utils/dependencyChecker';
import { toast } from 'sonner';

interface CharacterColumn {
    id: string;
    title: string;
    arcStatus: ArcStatus;
    characters: Character[];
    color: string;
}

interface CharacterBoardProps {
    showHeader?: boolean;
    triggerAdd?: boolean;
    initialData?: any;
    onSwitchToChatImageMode?: (modelId?: string, entityContext?: { type: string; id: string; name: string; workflow?: string }) => void;
}

export default function CharacterBoard({ showHeader = true, triggerAdd, initialData, onSwitchToChatImageMode }: CharacterBoardProps) {
    const { getToken } = useAuth();
    const queryClient = useQueryClient();
    const { 
        characters, 
        updateCharacter, 
        createCharacter, 
        deleteCharacter, 
        getCharacterScenes, 
        beats, 
        relationships, 
        isLoading, 
        hasInitializedFromDynamoDB, 
        isEntityInScript, 
        addImageToEntity,
        canEditScript,
        canUseAI,
        screenplayId
    } = useScreenplay();
    const { state: editorState } = useEditor();
    const [columns, setColumns] = useState<CharacterColumn[]>([]);
    const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    
    // Delete confirmation dialog state
    const [characterToDelete, setCharacterToDelete] = useState<Character | null>(null);
    const [deleteDependencyReport, setDeleteDependencyReport] = useState('');
    const [deleteSceneCount, setDeleteSceneCount] = useState(0);
    
    // Memoize isInScript checks to prevent render loops
    const scriptContent = editorState.content;
    const isInScriptMap = useMemo(() => {
        const map = new Map<string, boolean>();
        characters.forEach(char => {
            map.set(char.id, isEntityInScript(scriptContent, char.name, 'character'));
        });
        return map;
    }, [characters, scriptContent, isEntityInScript]);
    
    // 🔥 FIX: Sync selectedCharacter with latest character from context (for immediate UI updates)
    // This ensures changes from Production Hub Character Bank sync to Writing Section
    useEffect(() => {
        if (selectedCharacter?.id) {
            const updatedCharacter = characters.find(c => c.id === selectedCharacter.id);
            if (updatedCharacter) {
                // Update selectedCharacter to reflect changes from Production Hub
                setSelectedCharacter(updatedCharacter);
            }
        }
    }, [characters, selectedCharacter?.id]);
    
    // Listen for external trigger to add character
    useEffect(() => {
        if (triggerAdd) {
            setIsCreating(true);
            setIsEditing(false);
            setSelectedCharacter(null);
        }
    }, [triggerAdd]);

    // Initialize columns based on screenplay characters
    useEffect(() => {
        console.log('[CharacterBoard] 🔄 Characters changed:', characters.length, 'total');
        console.log('[CharacterBoard] 🔍 Character names:', characters.map(c => c.name));
        console.log('[CharacterBoard] 🔍 Character arcStatus values:', characters.map(c => ({ name: c.name, arcStatus: c.arcStatus, type: typeof c.arcStatus })));
        console.log('[CharacterBoard] 📊 Loading state:', { isLoading, hasInitializedFromDynamoDB });
        
        const introduced = characters.filter(c => c.arcStatus === 'introduced');
        const developing = characters.filter(c => c.arcStatus === 'developing');
        const resolved = characters.filter(c => c.arcStatus === 'resolved');
        
        console.log('[CharacterBoard] 📊 Filtered counts:', { 
            introduced: introduced.length, 
            developing: developing.length, 
            resolved: resolved.length 
        });

        const newColumns: CharacterColumn[] = [
            {
                id: 'col-introduced',
                title: 'Introduced',
                arcStatus: 'introduced',
                characters: introduced,
                color: '#3B82F6' // Blue
            },
            {
                id: 'col-developing',
                title: 'Developing',
                arcStatus: 'developing',
                characters: developing,
                color: '#F59E0B' // Orange
            },
            {
                id: 'col-resolved',
                title: 'Resolved',
                arcStatus: 'resolved',
                characters: resolved,
                color: '#10B981' // Green
            }
        ];

        setColumns(newColumns);
    }, [characters, isLoading, hasInitializedFromDynamoDB]);

    const handleDelete = async (characterId: string, characterName: string) => {
        const character = characters.find(c => c.id === characterId);
        if (!character) return;
        
        // Check dependencies
        const dependencies = getCharacterDependencies(characterId, beats, relationships);
        const report = generateCharacterReport(characterId, character, dependencies);
        
        // Show delete confirmation dialog
        setCharacterToDelete(character);
        setDeleteDependencyReport(report);
        setDeleteSceneCount(dependencies.totalAppearances);
    };
    
    const confirmDelete = async () => {
        if (!characterToDelete) return;
        
        try {
            await deleteCharacter(characterToDelete.id, 'remove');
            setCharacterToDelete(null);
            setSelectedCharacter(null);
        } catch (err: any) {
            alert(`Error deleting character: ${err.message}`);
        }
    };
    
    const cancelDelete = () => {
        setCharacterToDelete(null);
        setDeleteDependencyReport('');
        setDeleteSceneCount(0);
    };

    const openEditForm = (character: Character) => {
        setSelectedCharacter(character);
        setIsEditing(true);
    };

    return (
        <div className="flex flex-col h-full">
            {/* Loading State */}
            {isLoading && (
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#DC143C] mx-auto mb-4"></div>
                        <p className="text-slate-400">Loading characters...</p>
                    </div>
                </div>
            )}
            
            {/* Character Board Content */}
            {!isLoading && (
                <>
                    {/* Header - Simplified, matches LocationBoard */}
                    {showHeader && (
                        <div className="mb-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold" style={{ color: '#E5E7EB' }}>
                                        Character Board
                                    </h2>
                                    <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>
                                        Track character arcs throughout your screenplay
                                    </p>
                                </div>
                                {canEditScript && (
                                    <button
                                        onClick={() => setIsCreating(true)}
                                        className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all"
                                        style={{
                                            backgroundColor: '#DC143C',
                                            color: 'white',
                                        }}
                                    >
                                        <Plus size={18} />
                                        Add Character
                                    </button>
                                )}
                                {!canEditScript && (
                                    <span className="text-sm text-base-content/50">
                                        Read-only access
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

            {/* Character Columns - Matches LocationBoard style */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                {columns.map((column) => (
                    <div key={column.id} className="flex flex-col">
                        {/* Column Header - Clean style like LocationBoard */}
                        <div 
                            className="p-3 mb-3 rounded-lg border-l-4 flex items-center justify-between"
                            style={{
                                backgroundColor: '#1C1C1E',
                                borderLeftColor: column.color,
                            }}
                        >
                            <h3 className="font-semibold" style={{ color: '#E5E7EB' }}>
                                {column.title}
                            </h3>
                            <span 
                                className="px-2 py-1 rounded-md text-xs font-semibold"
                                style={{
                                    backgroundColor: column.color + '20',
                                    color: column.color,
                                }}
                            >
                                {column.characters.length}
                            </span>
                        </div>

                        {/* Characters List */}
                        <div 
                            className="flex-1 p-3 rounded-lg"
                            style={{
                                backgroundColor: '#0F0F11',
                                border: '1px solid #27272A',
                                minHeight: '400px',
                            }}
                        >
                            {/* Empty State */}
                            {column.characters.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-full py-12 px-4">
                                    <div
                                        className="w-16 h-16 rounded-full flex items-center justify-center mb-3"
                                        style={{
                                            backgroundColor: column.color + '15',
                                            border: `2px dashed ${column.color}40`,
                                        }}
                                    >
                                        <Users size={24} style={{ color: column.color }} />
                                    </div>
                                    <p className="text-sm text-center" style={{ color: '#9CA3AF' }}>
                                        No characters yet
                                    </p>
                                    <p className="text-xs text-center mt-1" style={{ color: '#6B7280' }}>
                                        Characters appear based on your screenplay
                                    </p>
                                </div>
                            )}

                            {/* Character Cards - Compact style like LocationBoard */}
                            <div className="space-y-2">
                                {column.characters.map((character, index) => (
                                    <motion.div
                                        key={character.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        <CharacterCardContent
                                            character={character}
                                            color={column.color}
                                            sceneCount={getCharacterScenes(character.id).length}
                                            isInScript={isInScriptMap.get(character.id) || false}
                                            onClick={() => setSelectedCharacter(character)}
                                            onEdit={() => openEditForm(character)}
                                            canEdit={canEditScript}
                                        />
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Character Detail Sidebar - Clean, no glass modal */}
            <AnimatePresence>
            {(isCreating || isEditing || selectedCharacter) && (
                <CharacterDetailSidebar
                    character={selectedCharacter} // 🔥 FIX: Always pass selectedCharacter when not creating (matches AssetBoard pattern)
                    isCreating={isCreating}
                    initialData={isCreating ? initialData : undefined}
                    onClose={() => {
                        setIsCreating(false);
                        setIsEditing(false);
                        setSelectedCharacter(null);
                    }}
                    onCreate={async (data) => {
                        try {
                            const { pendingImages, ...characterData } = data;
                            const newCharacter = await createCharacter({
                                ...characterData,
                                customFields: []
                            });
                            
                            // 🔥 FIX: Refetch Production Hub character cache so new character appears immediately
                            if (screenplayId) {
                                // Use refetchQueries for immediate update (matches deletion pattern)
                                queryClient.refetchQueries({ queryKey: ['characters', screenplayId] });
                            }
                            
                            // Add pending images after character creation
                            // Images are already uploaded to S3 via presigned URLs, just need to register them
                            if (pendingImages && pendingImages.length > 0 && newCharacter) {
                                // 🔥 FIX: Build images array and use updateCharacter (like assets use updateAsset)
                                // This does optimistic update FIRST, then calls API - ensures immediate UI update
                                const imageEntries = pendingImages.map(img => ({
                                    imageUrl: img.imageUrl,
                                    createdAt: new Date().toISOString(),
                                    metadata: {
                                        s3Key: img.s3Key,
                                        source: 'user-upload',
                                        createdIn: 'creation',
                                        prompt: img.prompt,
                                        modelUsed: img.modelUsed,
                                        angle: img.angle
                                    }
                                }));
                                
                                console.log('[CharacterBoard] 📸 Registering', imageEntries.length, 'images with character:', newCharacter.id);
                                await updateCharacter(newCharacter.id, {
                                    images: [
                                        ...(newCharacter.images || []), // Use images from the real character returned by createCharacter
                                        ...imageEntries
                                    ]
                                });
                                console.log('[CharacterBoard] ✅ Images registered successfully');
                                
                                // 🔥 FIX: Refresh character from context after images are registered
                                // Wait a bit for backend processing and context update
                                await new Promise(resolve => setTimeout(resolve, 500));
                                const updatedCharacter = characters.find(c => c.id === newCharacter.id);
                                if (updatedCharacter) {
                                    setSelectedCharacter(updatedCharacter);
                                } else {
                                    setSelectedCharacter(newCharacter);
                                }
                            } else {
                                // No pending images - just set the new character
                                setSelectedCharacter(newCharacter);
                            }
                            
                            // 🔥 FIX: Keep sidebar open with newly created character so uploads work immediately
                            // Match AssetBoard pattern: set selectedCharacter and close creating mode
                            setIsCreating(false);
                            setIsEditing(false); // Don't set isEditing - just close creating mode
                        } catch (err: any) {
                            alert(`Error creating character: ${err.message}`);
                        }
                    }}
                    onUpdate={async (character) => {
                        try {
                            await updateCharacter(character.id, character);
                        } catch (err: any) {
                            alert(`Error updating character: ${err.message}`);
                        }
                    }}
                    onDelete={async (characterId) => {
                        const character = characters.find(c => c.id === characterId);
                        if (character) {
                            handleDelete(characterId, character.name);
                        }
                    }}
                    onSwitchToChatImageMode={onSwitchToChatImageMode}
                />
            )}
            </AnimatePresence>
                </>
            )}
            
            {/* Delete Confirmation Dialog */}
            <DeleteCharacterDialog
                character={characterToDelete}
                dependencyReport={deleteDependencyReport}
                sceneCount={deleteSceneCount}
                onConfirm={confirmDelete}
                onCancel={cancelDelete}
            />
        </div>
    );
}

// ============================================================================
// CharacterCardContent Component - Compact style matching LocationBoard
// ============================================================================

interface CharacterCardContentProps {
    character: Character;
    color: string;
    sceneCount: number;
    isInScript: boolean;
    onClick: () => void;
    onEdit: () => void;
    canEdit: boolean;
}

function CharacterCardContent({
    character,
    color,
    sceneCount,
    isInScript,
    onClick,
    onEdit,
    canEdit,
}: CharacterCardContentProps) {
    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        
        // Copy Fountain-formatted character with @ notation and description
        // Format: @CHARACTER NAME (Fountain forced character notation)
        //         Description (as action line)
        // Matches script format: @CHARACTER\nDescription\n\n
        let fountainText = `@${character.name.toUpperCase()}\n`;
        
        // Add description as action line if it exists
        if (character.description && character.description.trim()) {
            fountainText += `${character.description}\n\n`;
        } else {
            // If no description, still add blank line for separation
            fountainText += `\n`;
        }
        
        navigator.clipboard.writeText(fountainText).then(() => {
            toast.success('Copied to clipboard! Paste in editor to insert character with @ notation and description');
        }).catch((err) => {
            console.error('Failed to copy:', err);
            toast.error('Failed to copy');
        });
    };

    return (
        <div
            className="p-3 rounded-lg border cursor-pointer hover:shadow-lg transition-all hover:scale-[1.01]"
            style={{
                backgroundColor: '#1C1C1E',
                borderColor: '#3F3F46',
            }}
            onClick={onClick}
        >
            {/* Character Info */}
            <div className="flex items-start gap-2">
                <div
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                    style={{
                        backgroundColor: color + '30',
                        color: color,
                    }}
                >
                    <User size={16} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h4 className="font-medium truncate text-sm" style={{ color: '#E5E7EB' }}>
                            {character.name}
                        </h4>
                        {!isInScript && (
                            <span
                                className="px-1.5 py-0.5 rounded text-xs font-medium"
                                style={{
                                    backgroundColor: '#6B7280',
                                    color: '#E5E7EB',
                                }}
                                title="This character hasn't appeared in the script yet"
                            >
                                Not in script
                            </span>
                        )}
                    </div>
                    <p className="text-xs truncate capitalize" style={{ color: '#9CA3AF' }}>
                        {character.type}
                    </p>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={handleCopy}
                        className="p-1 rounded hover:bg-gray-700/50 transition-colors"
                        title="Copy Fountain format to clipboard"
                    >
                        <Copy size={14} style={{ color: '#9CA3AF' }} />
                    </button>
                    {canEdit && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit();
                            }}
                            className="p-1 rounded hover:bg-gray-700/50 transition-colors"
                            title="Edit character"
                        >
                            <MoreVertical size={14} style={{ color: '#9CA3AF' }} />
                        </button>
                    )}
                </div>
            </div>

            {/* Description - Compact */}
            {character.description && (
                <p className="text-xs mt-2 line-clamp-1" style={{ color: '#9CA3AF' }}>
                    {character.description}
                </p>
            )}

            {/* Stats - Compact */}
            <div className="flex items-center gap-2 mt-2 text-xs" style={{ color: '#6B7280' }}>
                <span>📝 {sceneCount}</span>
                {(() => {
                    // 🔥 FIX: Only count Creation images (user-uploaded), not AI-generated Production Hub images
                    // Filter out images with source='pose-generation' or createdIn='production-hub'
                    const creationImages = (character.images || []).filter((img: any) => {
                        const metadata = img.metadata || {};
                        return metadata.source !== 'pose-generation' && metadata.createdIn !== 'production-hub';
                    });
                    return creationImages.length > 0 ? (
                        <span className="text-blue-400">🖼️ {creationImages.length}</span>
                    ) : null;
                })()}
            </div>
        </div>
    );
}
