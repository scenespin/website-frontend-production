'use client';

import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { Plus, MoreVertical, User, Users, GitBranch, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import type { Character, ArcStatus } from '@/types/screenplay';
import CharacterDetailSidebar from './CharacterDetailSidebar';
import CharacterRelationshipMap from './CharacterRelationshipMap';
import { DeleteCharacterDialog } from '../structure/DeleteConfirmDialog';
import { CharacterImageViewer } from '@/components/characters/CharacterImageViewer';
import CharacterBankManager from '@/components/production/CharacterBankManager';
import { getCharacterDependencies, generateCharacterReport } from '@/utils/dependencyChecker';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
    initialData?: any; // NEW: Pre-filled data from AI workflow
    onSwitchToChatImageMode?: (modelId?: string, entityContext?: { type: string; id: string; name: string; workflow?: string }) => void;
}

export default function CharacterBoard({ showHeader = true, triggerAdd, initialData, onSwitchToChatImageMode }: CharacterBoardProps) {
    const { characters, updateCharacter, createCharacter, deleteCharacter, getCharacterScenes, beats, relationships } = useScreenplay();
    const [columns, setColumns] = useState<CharacterColumn[]>([]);
    const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [viewMode, setViewMode] = useState<'board' | 'map'>('board');
    const [formData, setFormData] = useState({
        name: '',
        type: 'lead' as 'lead' | 'supporting' | 'minor',
        arcStatus: 'introduced' as 'introduced' | 'developing' | 'resolved',
        description: '',
        arcNotes: ''
    });
    
    // Delete confirmation dialog state
    const [characterToDelete, setCharacterToDelete] = useState<Character | null>(null);
    const [deleteDependencyReport, setDeleteDependencyReport] = useState('');
    const [deleteSceneCount, setDeleteSceneCount] = useState(0);
    
    // Image viewer state
    const [imageViewerCharacter, setImageViewerCharacter] = useState<Character | null>(null);
    
    // Character Bank Manager state
    const [characterBankOpen, setCharacterBankOpen] = useState(false);
    const [characterBankTarget, setCharacterBankTarget] = useState<Character | null>(null);
    
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
        const introduced = characters.filter(c => c.arcStatus === 'introduced');
        const developing = characters.filter(c => c.arcStatus === 'developing');
        const resolved = characters.filter(c => c.arcStatus === 'resolved');

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
    }, [characters]);

    const handleDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) {
            return;
        }

        const sourceColumn = columns.find(col => col.id === source.droppableId);
        const destColumn = columns.find(col => col.id === destination.droppableId);

        if (!sourceColumn || !destColumn) return;

        const character = sourceColumn.characters.find(c => c.id === draggableId);
        if (!character) return;

        // Update character arc status
        await updateCharacter(character.id, {
            arcStatus: destColumn.arcStatus
        });
    };

    const handleCreate = async () => {
        try {
            await createCharacter({
                name: formData.name,
                type: formData.type,
                arcStatus: formData.arcStatus,
                description: formData.description,
                arcNotes: formData.arcNotes,
                customFields: []
            });
            setIsCreating(false);
            setFormData({
                name: '',
                type: 'lead',
                arcStatus: 'introduced',
                description: '',
                arcNotes: ''
            });
        } catch (err: any) {
            alert(`Error creating character: ${err.message}`);
        }
    };

    const handleEdit = async () => {
        if (!selectedCharacter) return;
        try {
            await updateCharacter(selectedCharacter.id, {
                name: formData.name,
                type: formData.type,
                arcStatus: formData.arcStatus,
                description: formData.description,
                arcNotes: formData.arcNotes
            });
            setIsEditing(false);
            setSelectedCharacter(null);
        } catch (err: any) {
            alert(`Error updating character: ${err.message}`);
        }
    };

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
        setFormData({
            name: character.name,
            type: character.type,
            arcStatus: character.arcStatus,
            description: character.description || '',
            arcNotes: character.arcNotes || ''
        });
        setSelectedCharacter(character);
        setIsEditing(true);
    };

    return (
        <div className="flex flex-col h-full bg-background">
            {/* Header - Optional */}
            {showHeader && (
                <div className="p-6 pl-16 sm:pl-6 border-b border-border flex items-center justify-between bg-card/50 backdrop-blur-sm">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                            {viewMode === 'board' ? 'Character Arc Board' : 'Character Relationships'}
                        </h2>
                        <p className="text-xs sm:text-sm mt-1 text-muted-foreground">
                            {viewMode === 'board' 
                                ? 'Drag characters between stages to track their story arcs'
                                : 'Visualize how characters interact throughout your screenplay'
                            }
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* View Toggle */}
                        <div className="flex items-center gap-1 p-1 rounded-lg bg-muted">
                            <Button
                                variant={viewMode === 'board' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setViewMode('board')}
                                className="gap-2"
                            >
                                <Users size={16} />
                                Board
                            </Button>
                            <Button
                                variant={viewMode === 'map' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setViewMode('map')}
                                className="gap-2"
                            >
                                <GitBranch size={16} />
                                Map
                            </Button>
                        </div>
                        {viewMode === 'board' && (
                            <Button
                                onClick={() => setIsCreating(true)}
                                className="gap-2 shrink-0"
                            >
                                <Plus size={18} />
                                <span className="hidden sm:inline">Add Character</span>
                                <span className="sm:hidden">Add</span>
                            </Button>
                        )}
                    </div>
                </div>
            )}

            {/* Kanban Board View */}
            <AnimatePresence mode="wait">
            {viewMode === 'board' && (
                <motion.div
                    key="board-view"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="flex-1 overflow-x-auto p-6"
                >
                    <DragDropContext onDragEnd={handleDragEnd}>
                        {/* Mobile: Vertical Stack, Desktop: 3 Columns */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
                        {columns.map((column) => (
                            <div key={column.id} className="flex flex-col min-w-0">
                                {/* Column Header - Modern Style */}
                                <Card className="p-4 mb-3 border-l-4 shadow-sm" style={{ borderLeftColor: column.color }}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div 
                                                className="w-2 h-2 rounded-full animate-pulse"
                                                style={{ backgroundColor: column.color }}
                                            />
                                            <h3 className="font-semibold text-base text-foreground">
                                                {column.title}
                                            </h3>
                                        </div>
                                        <Badge 
                                            variant="secondary"
                                            className="font-semibold"
                                            style={{ 
                                                backgroundColor: column.color + '20',
                                                color: column.color,
                                                borderColor: column.color + '30'
                                            }}
                                        >
                                            {column.characters.length}
                                        </Badge>
                                    </div>
                                </Card>

                                {/* Droppable Area */}
                                <Droppable droppableId={column.id}>
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            className={cn(
                                                "flex-1 p-3 rounded-xl min-h-[400px] transition-all duration-200",
                                                "border-2",
                                                snapshot.isDraggingOver 
                                                    ? "border-dashed bg-accent/10" 
                                                    : "border-border bg-card/30"
                                            )}
                                            style={{
                                                backgroundColor: snapshot.isDraggingOver ? column.color + '10' : undefined,
                                                borderColor: snapshot.isDraggingOver ? column.color : undefined
                                            }}
                                        >
                                            {/* Empty State */}
                                            {column.characters.length === 0 && (
                                                <div className="flex flex-col items-center justify-center h-full py-12 px-4">
                                                    <div 
                                                        className="w-16 h-16 rounded-full flex items-center justify-center mb-4 border-2 border-dashed"
                                                        style={{ 
                                                            backgroundColor: column.color + '10',
                                                            borderColor: column.color + '40'
                                                        }}
                                                    >
                                                        <Users size={28} style={{ color: column.color }} />
                                                    </div>
                                                    <p className="text-sm text-center text-muted-foreground">
                                                        No characters yet
                                                    </p>
                                                    <p className="text-xs text-center mt-1 text-muted-foreground/60">
                                                        Drag characters here or create new ones
                                                    </p>
                                                </div>
                                            )}
                                            
                                            {/* Character Cards */}
                                            {column.characters.map((character, index) => {
                                                const scenes = getCharacterScenes(character.id);
                                                
                                                return (
                                                    <Draggable
                                                        key={character.id}
                                                        draggableId={character.id}
                                                        index={index}
                                                    >
                                                        {(provided, snapshot) => (
                                                            <div
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                {...provided.dragHandleProps}
                                                                style={provided.draggableProps.style}
                                                            >
                                                                <motion.div
                                                                    initial={{ opacity: 0, y: 20 }}
                                                                    animate={{ opacity: 1, y: 0 }}
                                                                    transition={{ delay: index * 0.05 }}
                                                                    whileHover={{ 
                                                                        scale: snapshot.isDragging ? 1 : 1.02,
                                                                        y: snapshot.isDragging ? 0 : -2
                                                                    }}
                                                                    onClick={() => setSelectedCharacter(character)}
                                                                >
                                                                <Card 
                                                                    className={cn(
                                                                        "p-3 cursor-pointer hover:shadow-lg transition-all border-l-2",
                                                                        snapshot.isDragging && "shadow-xl ring-2"
                                                                    )}
                                                                    style={{
                                                                        borderLeftColor: column.color,
                                                                        ['--tw-ring-color' as any]: snapshot.isDragging ? column.color : undefined
                                                                    }}
                                                                >
                                                                {/* Character Info */}
                                                                <div className="flex items-start gap-3">
                                                                    <div 
                                                                        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                                                                        style={{ 
                                                                            backgroundColor: column.color + '20',
                                                                            color: column.color
                                                                        }}
                                                                    >
                                                                        <User size={18} />
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <h4 className="font-semibold truncate text-foreground">
                                                                            {character.name}
                                                                        </h4>
                                                                        <p className="text-xs truncate text-muted-foreground capitalize">
                                                                            {character.type}
                                                                        </p>
                                                                    </div>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8 shrink-0"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            openEditForm(character);
                                                                        }}
                                                                        title="Edit character"
                                                                    >
                                                                        <MoreVertical size={16} />
                                                                    </Button>
                                                                </div>

                                                                {/* Description */}
                                                                {character.description && (
                                                                    <p className="text-xs mt-3 line-clamp-2 text-muted-foreground leading-relaxed">
                                                                        {character.description}
                                                                    </p>
                                                                )}

                                                                {/* Stats */}
                                                                <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                                                                    <span className="flex items-center gap-1">
                                                                        📝 {scenes.length} scenes
                                                                    </span>
                                                                    {character.githubIssueNumber && (
                                                                        <span className="flex items-center gap-1">
                                                                            🔗 #{character.githubIssueNumber}
                                                                        </span>
                                                                    )}
                                                                    {character.images && character.images.length > 0 && (
                                                                        <span className="flex items-center gap-1 text-blue-400">
                                                                            🖼️ {character.images.length}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                
                                                                {/* View Images Button - Show if images exist */}
                                                                {character.images && character.images.length > 0 && (
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className="w-full mt-3 h-8 text-xs gap-1.5"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setImageViewerCharacter(character);
                                                                        }}
                                                                    >
                                                                        <ImageIcon size={14} />
                                                                        View Images ({character.images.length})
                                                                    </Button>
                                                                )}
                                                            </Card>
                                                                </motion.div>
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                );
                                            })}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </div>
                        ))}
                    </div>
                </DragDropContext>
                </motion.div>
            )}
            
            {/* Character Relationship Map View */}
            {viewMode === 'map' && (
                <motion.div
                    key="map-view"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="flex-1 overflow-hidden"
                >
                    <CharacterRelationshipMap />
                </motion.div>
            )}
            </AnimatePresence>

            {/* Character Detail Sidebar */}
            <AnimatePresence>
            {(isCreating || isEditing || selectedCharacter) && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-background z-[9998]"
                        onClick={() => {
                            setIsCreating(false);
                            setIsEditing(false);
                            setSelectedCharacter(null);
                        }}
                    />
                    
                    <CharacterDetailSidebar
                        character={isEditing || (!isCreating && selectedCharacter) ? selectedCharacter : null}
                        isCreating={isCreating}
                        initialData={isCreating ? initialData : undefined}
                        onClose={() => {
                            setIsCreating(false);
                            setIsEditing(false);
                            setSelectedCharacter(null);
                        }}
                        onCreate={async (data) => {
                            try {
                                await createCharacter({
                                    ...data,
                                    customFields: []
                                });
                                setIsCreating(false);
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
                        onOpenCharacterBank={(characterId) => {
                            const character = characters.find(c => c.id === characterId);
                            if (character) {
                                setCharacterBankTarget(character);
                                setCharacterBankOpen(true);
                            }
                        }}
                    />
                </>
            )}
            </AnimatePresence>
            
            {/* Delete Confirmation Dialog */}
            <DeleteCharacterDialog
                character={characterToDelete}
                dependencyReport={deleteDependencyReport}
                sceneCount={deleteSceneCount}
                onConfirm={confirmDelete}
                onCancel={cancelDelete}
            />
            
            {/* Image Viewer */}
            {imageViewerCharacter && (
                <CharacterImageViewer
                    isOpen={true}
                    character={imageViewerCharacter}
                    onClose={() => setImageViewerCharacter(null)}
                    onDeleteImage={async (imageUrl) => {
                        try {
                            // Remove image from character's images array
                            const updatedImages = imageViewerCharacter.images?.filter(img => img.imageUrl !== imageUrl) || [];
                            await updateCharacter(imageViewerCharacter.id, {
                                ...imageViewerCharacter,
                                images: updatedImages
                            });
                            // Update local state
                            setImageViewerCharacter({
                                ...imageViewerCharacter,
                                images: updatedImages
                            });
                        } catch (err: any) {
                            alert(`Error deleting image: ${err.message}`);
                        }
                    }}
                />
            )}
            
            {/* Character Bank Manager - Renders as its own modal */}
            {characterBankOpen && characterBankTarget && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-base-100 dark:bg-base-300 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h2 className="text-xl font-bold">Character Bank - {characterBankTarget.name}</h2>
                            <button
                                onClick={() => {
                                    setCharacterBankOpen(false);
                                    setCharacterBankTarget(null);
                                }}
                                className="p-2 hover:bg-base-100 dark:hover:bg-base-content/20 rounded"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="overflow-auto max-h-[calc(90vh-4rem)]">
                            <CharacterBankManager
                                projectId="default"
                                onCharacterSelect={(characterId) => {
                                    console.log('Character selected:', characterId);
                                    setCharacterBankOpen(false);
                                    setCharacterBankTarget(null);
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

