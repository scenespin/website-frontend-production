'use client';

import React, { useState, useEffect, useRef } from 'react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { Plus, MoreVertical, Users, MapPin, Film, BookOpen, Image as ImageIcon, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { useContextStore } from '@/lib/contextStore';
import type { StoryBeat, Scene } from '@/types/screenplay';
import { toast } from 'sonner';

interface BeatColumn {
    id: string;
    beat: StoryBeat;
    color: string;
}

interface BeatBoardProps {
    projectId?: string;
}

export default function BeatBoard({ projectId }: BeatBoardProps) {
    const { 
        beats, 
        characters, 
        locations, 
        updateScene, 
        deleteScene,
        createScene,
        moveScene,
    } = useScreenplay();
    
    // Contextual Navigation Integration
    const context = useContextStore((state) => state.context);
    const setCurrentBeat = useContextStore((state) => state.setCurrentBeat);
    const setCurrentScene = useContextStore((state) => state.setCurrentScene);
    const clearContext = useContextStore((state) => state.clearContext);
    
    const [columns, setColumns] = useState<BeatColumn[]>([]);
    const [selectedScene, setSelectedScene] = useState<Scene | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [highlightedBeatId, setHighlightedBeatId] = useState<string | null>(null);
    const [highlightedSceneId, setHighlightedSceneId] = useState<string | null>(null);
    const beatRefs = useRef<Record<string, HTMLDivElement | null>>({});
    
    // Color palette for story beats (matches 8-Sequence structure)
    const beatColors = [
        '#3B82F6', // Blue - Sequence 1
        '#8B5CF6', // Purple - Sequence 2
        '#EC4899', // Pink - Sequence 3
        '#F59E0B', // Orange - Sequence 4
        '#10B981', // Green - Sequence 5
        '#14B8A6', // Teal - Sequence 6
        '#EF4444', // Red - Sequence 7
        '#6366F1', // Indigo - Sequence 8
    ];
    
    // Initialize columns based on story beats
    useEffect(() => {
        const newColumns: BeatColumn[] = beats.map((beat, index) => ({
            id: beat.id,
            beat,
            color: beatColors[index % beatColors.length]
        }));
        
        setColumns(newColumns);
    }, [beats]);
    
    // 🎯 CONTEXTUAL NAVIGATION: Auto-focus on current beat/scene from editor
    useEffect(() => {
        if (!context.currentBeatId && !context.currentSceneId) return;
        
        // Highlight the beat/scene from context
        if (context.currentBeatId) {
            setHighlightedBeatId(context.currentBeatId);
        }
        
        if (context.currentSceneId) {
            setHighlightedSceneId(context.currentSceneId);
        }
        
        // Auto-scroll to the beat
        if (context.currentBeatId && beatRefs.current[context.currentBeatId]) {
            setTimeout(() => {
                beatRefs.current[context.currentBeatId]?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                    inline: 'center'
                });
            }, 300); // Delay to ensure render
        }
        
        // Clear highlights after 3 seconds
        const timer = setTimeout(() => {
            setHighlightedBeatId(null);
            setHighlightedSceneId(null);
        }, 3000);
        
        return () => clearTimeout(timer);
    }, [context.currentBeatId, context.currentSceneId]);
    
    const handleEditScene = (scene: Scene, beat: StoryBeat) => {
        setSelectedScene(scene);
        setIsCreating(false);
        
        // Update context when user clicks a scene
        setCurrentScene(scene.id, scene.heading);
        setCurrentBeat(beat.id, beat.title);
        
        toast.info('Scene editing panel (to be implemented)');
    };
    
    const handleCloseForm = () => {
        setSelectedScene(null);
        setIsCreating(false);
    };
    
    const handleDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId } = result;

        // No destination or dropped in same place
        if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) {
            return;
        }

        const sourceBeatId = source.droppableId;
        const destBeatId = destination.droppableId;
        
        const sourceBeat = beats.find(b => b.id === sourceBeatId);
        const destBeat = beats.find(b => b.id === destBeatId);

        if (!sourceBeat || !destBeat) return;

        const scene = sourceBeat.scenes.find(s => s.id === draggableId);
        if (!scene) return;

        try {
            // Move scene to new beat using ScreenplayContext
            // This automatically updates GitHub and the .fountain script!
            await moveScene(scene.id, destBeatId, destination.index);
            
            toast.success(`Moved scene "${scene.heading}" to ${destBeat.title}`, {
                description: 'GitHub synced automatically'
            });
        } catch (error) {
            console.error('Failed to move scene:', error);
            toast.error('Failed to move scene', {
                description: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };
    
    const getStatusColor = (status: 'draft' | 'review' | 'final') => {
        switch (status) {
            case 'final': return '#10B981'; // Green
            case 'review': return '#F59E0B'; // Orange
            case 'draft': return '#6B7280'; // Gray
            default: return '#6B7280';
        }
    };
    
    // Helper to get scene characters
    const getSceneCharacters = (sceneId: string) => {
        const scene = beats.flatMap(b => b.scenes).find(s => s.id === sceneId);
        if (!scene) return [];
        
        const characterIds = scene.fountain.tags.characters || [];
        return characters.filter(c => characterIds.includes(c.id));
    };

    return (
        <DragDropContext onDragEnd={handleDragEnd}>
            <div 
                className="flex flex-col h-full w-full overflow-hidden bg-slate-900"
            >
                {/* Header */}
                <div className="p-4 md:p-6 border-b border-slate-700 flex items-center justify-between shrink-0">
                    <div>
                        <h2 className="text-xl md:text-2xl font-bold text-slate-200">
                            Story Beat Board
                        </h2>
                        <p className="text-xs md:text-sm mt-1 text-slate-400">
                            Drag scenes between sequences to reorganize your screenplay
                        </p>
                    </div>
                    <button
                        onClick={() => toast.info('Add scene feature (to be connected)')}
                        className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg font-medium transition-all hover:scale-105 shrink-0 bg-[#DC143C] hover:bg-[#B01030] text-white"
                    >
                        <Plus size={18} />
                        <span className="hidden sm:inline">Add Scene</span>
                    </button>
                </div>
                
                {/* 🎯 Context Banner - Shows where user came from */}
                {(context.currentSceneName || context.currentBeatName) && (
                    <div className="bg-blue-500/10 border-b border-blue-500/30 px-4 py-2 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm">
                            <ArrowLeft className="w-4 h-4 text-blue-400" />
                            <span className="text-slate-300">
                                {context.currentBeatName && (
                                    <span className="font-semibold text-blue-400">{context.currentBeatName}</span>
                                )}
                                {context.currentSceneName && (
                                    <span className="text-slate-400"> → {context.currentSceneName}</span>
                                )}
                            </span>
                        </div>
                        <button
                            onClick={() => clearContext()}
                            className="text-xs text-slate-400 hover:text-white transition-colors"
                        >
                            Clear
                        </button>
                    </div>
                )}
                
                {/* Kanban Board */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden">
                    {/* Empty State */}
                    {beats.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full p-12">
                            <div 
                                className="w-24 h-24 rounded-full flex items-center justify-center mb-6 bg-blue-500/10 border-2 border-dashed border-blue-500/30"
                            >
                                <BookOpen size={40} className="text-[#DC143C]/60" />
                            </div>
                            <h3 className="text-xl font-bold mb-2 text-slate-200">
                                No Story Beats Yet
                            </h3>
                            <p className="text-sm text-center max-w-md text-slate-400">
                                Story beats will auto-create when you start a new project. The 8-Sequence structure provides a professional screenplay framework.
                            </p>
                        </div>
                    ) : (
                        <div 
                            className={`min-h-full p-4 md:p-6 ${
                                beats.length <= 3 
                                    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6' 
                                    : 'flex gap-4 md:gap-6 overflow-x-auto'
                            }`}
                        >
                            {columns.map(column => {
                                // CRITICAL FIX: Ensure scenes is always an array, not a number or other type
                                const scenes = Array.isArray(column.beat.scenes) ? column.beat.scenes : [];
                                const isHighlighted = highlightedBeatId === column.id;
                                
                                return (
                                    <div 
                                        key={column.id}
                                        ref={(el) => { beatRefs.current[column.id] = el; }}
                                        data-beat-id={column.beat.id}
                                        className="flex flex-col min-w-0"
                                        style={{ minWidth: beats.length > 3 ? '320px' : undefined }}
                                    >
                                        {/* Column Header - Story Beat Info */}
                                        <div 
                                            className={`rounded-xl p-4 mb-3 backdrop-blur-sm transition-all duration-300 ${
                                                isHighlighted ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-slate-900' : ''
                                            }`}
                                            style={{ 
                                                background: isHighlighted 
                                                    ? `linear-gradient(135deg, ${column.color}30, ${column.color}15)`
                                                    : `linear-gradient(135deg, ${column.color}15, ${column.color}05)`,
                                                borderLeft: `3px solid ${column.color}`,
                                                boxShadow: isHighlighted 
                                                    ? `0 4px 12px rgba(59, 130, 246, 0.3)`
                                                    : '0 2px 8px rgba(0,0,0,0.1)'
                                            }}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <div 
                                                            className="w-2 h-2 rounded-full animate-pulse"
                                                            style={{ backgroundColor: column.color }}
                                                        />
                                                        <h3 className="font-bold text-sm md:text-base tracking-tight truncate text-slate-200">
                                                            {column.beat.title}
                                                        </h3>
                                                    </div>
                                                    {column.beat.description && (
                                                        <p className="text-xs mt-1 line-clamp-2 leading-relaxed text-slate-400">
                                                            {column.beat.description}
                                                        </p>
                                                    )}
                                                </div>
                                                <span 
                                                    className="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0"
                                                    style={{ 
                                                        backgroundColor: column.color + '30',
                                                        color: column.color
                                                    }}
                                                >
                                                    {scenes.length}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Droppable Scene Cards */}
                                        <Droppable droppableId={column.id}>
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.droppableProps}
                                                    className="flex-1 p-3 rounded-xl min-h-[400px] transition-all duration-200"
                                                    style={{
                                                        backgroundColor: snapshot.isDraggingOver 
                                                            ? column.color + '15'
                                                            : '#0A0A0B',
                                                        border: snapshot.isDraggingOver
                                                            ? `2px dashed ${column.color}`
                                                            : '2px solid #1C1C1E'
                                                    }}
                                                >
                                                    {/* Empty State */}
                                                    {scenes.length === 0 && (
                                                        <div className="flex flex-col items-center justify-center h-full py-12 px-4">
                                                            <div 
                                                                className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                                                                style={{ 
                                                                    backgroundColor: column.color + '15',
                                                                    border: `2px dashed ${column.color}40`
                                                                }}
                                                            >
                                                                <Film size={28} style={{ color: column.color + '80' }} />
                                                            </div>
                                                            <p className="text-sm text-center text-slate-500">
                                                                No scenes yet
                                                            </p>
                                                            <p className="text-xs text-center mt-1 text-slate-600">
                                                                Drag scenes here or create new ones
                                                            </p>
                                                        </div>
                                                    )}
                                                    
                                                    {/* Scene Cards */}
                                                    {scenes.map((scene, index) => {
                                                        const sceneCharacters = getSceneCharacters(scene.id);
                                                        const location = scene.fountain?.tags?.location 
                                                            ? locations.find(l => l.id === scene.fountain.tags.location)
                                                            : undefined;
                                                        const isSceneHighlighted = highlightedSceneId === scene.id;

                                                        return (
                                                            <Draggable
                                                                key={scene.id}
                                                                draggableId={scene.id}
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
                                                                            data-scene-id={scene.id}
                                                                            initial={{ opacity: 0, y: 20 }}
                                                                            animate={{ opacity: 1, y: 0 }}
                                                                            transition={{ delay: index * 0.05 }}
                                                                            whileHover={{ 
                                                                                scale: snapshot.isDragging ? 1 : 1.02,
                                                                                y: snapshot.isDragging ? 0 : -4
                                                                            }}
                                                                            className={`mb-2 p-3 rounded-lg border cursor-pointer hover:shadow-lg transition-all ${
                                                                                isSceneHighlighted ? 'ring-2 ring-blue-400' : ''
                                                                            }`}
                                                                            style={{
                                                                                backgroundColor: isSceneHighlighted
                                                                                    ? column.color + '30'
                                                                                    : snapshot.isDragging
                                                                                    ? '#3F3F46'
                                                                                    : '#1C1C1E',
                                                                                borderColor: isSceneHighlighted
                                                                                    ? '#3B82F6'
                                                                                    : snapshot.isDragging
                                                                                    ? column.color
                                                                                    : '#3F3F46'
                                                                            }}
                                                                            onClick={() => handleEditScene(scene, column.beat)}
                                                                        >
                                                                            {/* Card Header */}
                                                                            <div className="flex items-start gap-2">
                                                                                <div 
                                                                                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                                                                                    style={{ 
                                                                                        backgroundColor: column.color + '30',
                                                                                        color: column.color
                                                                                    }}
                                                                                >
                                                                                    <span className="text-xs font-bold">{scene.number}</span>
                                                                                </div>
                                                                                <div className="flex-1 min-w-0">
                                                                                    <div className="flex items-center gap-2 mb-1">
                                                                                        <div 
                                                                                            className="w-2 h-2 rounded-full"
                                                                                            style={{ backgroundColor: getStatusColor(scene.status) }}
                                                                                            title={scene.status}
                                                                                        />
                                                                                        <span className="text-xs capitalize text-slate-400">
                                                                                            {scene.status}
                                                                                        </span>
                                                                                    </div>

                                                                                    {/* Scene Heading */}
                                                                                    <h4 
                                                                                        className="font-medium text-sm line-clamp-2 leading-tight mt-1 text-slate-200"
                                                                                    >
                                                                                        {scene.heading}
                                                                                    </h4>
                                                                                </div>
                                                                                <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    handleEditScene(scene, column.beat);
                                                                                }}
                                                                                    className="p-1 rounded hover:bg-slate-700 transition-colors flex-shrink-0 text-slate-400"
                                                                                    title="Edit scene"
                                                                                >
                                                                                    <MoreVertical size={14} />
                                                                                </button>
                                                                            </div>

                                                                            {/* Synopsis */}
                                                                            {scene.synopsis && (
                                                                                <p 
                                                                                    className="text-xs mt-3 line-clamp-2 leading-relaxed text-slate-400"
                                                                                >
                                                                                    {scene.synopsis}
                                                                                </p>
                                                                            )}

                                                                            {/* Metadata */}
                                                                            <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                                                                                {sceneCharacters.length > 0 && (
                                                                                    <span className="flex items-center gap-1">
                                                                                        <Users size={12} />
                                                                                        {sceneCharacters.length}
                                                                                    </span>
                                                                                )}
                                                                                {location && (
                                                                                    <span className="flex items-center gap-1 truncate">
                                                                                        <MapPin size={12} />
                                                                                        <span className="truncate">{location.name}</span>
                                                                                    </span>
                                                                                )}
                                                                                {scene.images && scene.images.length > 0 && (
                                                                                    <span className="flex items-center gap-1">
                                                                                        <ImageIcon size={12} />
                                                                                        {scene.images.length}
                                                                                    </span>
                                                                                )}
                                                                            </div>
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
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </DragDropContext>
    );
}

