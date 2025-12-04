'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, MapPin, Film, MoreVertical, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useScreenplay } from '@/contexts/ScreenplayContext'
import { useAuth } from '@clerk/nextjs';
import { useEditor } from '@/contexts/EditorContext';
import type { Location, LocationType } from '@/types/screenplay';
import LocationDetailSidebar from './LocationDetailSidebar';
import { DeleteLocationDialog } from '../structure/DeleteConfirmDialog';
import { getLocationDependencies, generateLocationReport } from '@/utils/dependencyChecker';
import { toast } from 'sonner';

interface LocationColumn {
    id: string;
    title: string;
    locationType: LocationType;
    locations: Location[];
    color: string;
}

interface LocationBoardProps {
    showHeader?: boolean;
    triggerAdd?: boolean;
    initialData?: any;
    onSwitchToChatImageMode?: (modelId?: string, entityContext?: { type: string; id: string; name: string; workflow?: string }) => void;
}

export default function LocationBoard({ showHeader = true, triggerAdd, initialData, onSwitchToChatImageMode }: LocationBoardProps) {
    const { getToken } = useAuth();
    const { 
        locations, 
        updateLocation, 
        createLocation, 
        deleteLocation, 
        getLocationScenes, 
        beats, 
        relationships, 
        isLoading, 
        hasInitializedFromDynamoDB, 
        isEntityInScript,
        screenplayId, 
        addImageToEntity,
        canEditScript,
        canUseAI
    } = useScreenplay();
    const { state: editorState } = useEditor();
    const [columns, setColumns] = useState<LocationColumn[]>([]);
    const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedColumnType, setSelectedColumnType] = useState<LocationType | null>(null); // 🔥 NEW: Track which column type was selected
    const [formData, setFormData] = useState({
        name: '',
        type: 'INT' as 'INT' | 'EXT' | 'INT/EXT',
        description: '',
        address: '',
        atmosphereNotes: '',
        setRequirements: '',
        productionNotes: ''
    });
    
    // Delete confirmation dialog state
    const [locationToDelete, setLocationToDelete] = useState<Location | null>(null);
    const [deleteDependencyReport, setDeleteDependencyReport] = useState('');
    const [deleteSceneCount, setDeleteSceneCount] = useState(0);
    
    // Memoize isInScript checks to prevent render loops
    const scriptContent = editorState.content;
    const isInScriptMap = useMemo(() => {
        const map = new Map<string, boolean>();
        locations.forEach(loc => {
            map.set(loc.id, isEntityInScript(scriptContent, loc.name, 'location'));
        });
        return map;
    }, [locations, scriptContent, isEntityInScript]);
    
    // Listen for external trigger to add location
    useEffect(() => {
        if (triggerAdd) {
            setIsCreating(true);
            setIsEditing(false);
            setSelectedLocation(null);
        }
    }, [triggerAdd]);

    // Initialize columns based on location types
    useEffect(() => {
        console.log('[LocationBoard] 🔄 Locations changed:', locations.length, 'total');
        console.log('[LocationBoard] 🔍 Location names:', locations.map(l => l.name));
        console.log('[LocationBoard] 📊 Loading state:', { isLoading, hasInitializedFromDynamoDB });
        
        const interiors = locations.filter(l => l.type === 'INT');
        const exteriors = locations.filter(l => l.type === 'EXT');
        const both = locations.filter(l => l.type === 'INT/EXT');

        const newColumns: LocationColumn[] = [
            {
                id: 'col-int',
                title: 'Interior',
                locationType: 'INT',
                locations: interiors,
                color: '#8B5CF6' // Purple
            },
            {
                id: 'col-ext',
                title: 'Exterior',
                locationType: 'EXT',
                locations: exteriors,
                color: '#10B981' // Green
            },
            {
                id: 'col-both',
                title: 'INT/EXT',
                locationType: 'INT/EXT',
                locations: both,
                color: '#F59E0B' // Orange
            }
        ];

        setColumns(newColumns);
    }, [locations, isLoading, hasInitializedFromDynamoDB]);

    const handleDelete = async (locationId: string, locationName: string) => {
        const location = locations.find(l => l.id === locationId);
        if (!location) return;
        
        // Check dependencies
        const dependencies = getLocationDependencies(locationId, beats, relationships);
        const report = generateLocationReport(locationId, location, dependencies);
        
        // Show delete confirmation dialog
        setLocationToDelete(location);
        setDeleteDependencyReport(report);
        setDeleteSceneCount(dependencies.totalUsages);
    };
    
    const confirmDelete = async () => {
        if (!locationToDelete) return;
        
        try {
            await deleteLocation(locationToDelete.id, 'remove');
            setLocationToDelete(null);
            setSelectedLocation(null);
        } catch (err: any) {
            alert(`Error deleting location: ${err.message}`);
        }
    };
    
    const cancelDelete = () => {
        setLocationToDelete(null);
        setDeleteDependencyReport('');
        setDeleteSceneCount(0);
    };

    const openEditForm = (location: Location) => {
        setFormData({
            name: location.name,
            type: location.type,
            description: location.description || '',
            address: location.address || '',
            atmosphereNotes: location.atmosphereNotes || '',
            setRequirements: location.setRequirements || '',
            productionNotes: location.productionNotes || ''
        });
        setSelectedLocation(location);
        setIsEditing(true);
    };

    return (
        <div className="flex flex-col h-full" style={{ backgroundColor: '#1C1C1E' }}>
            {/* Loading State */}
            {isLoading && (
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#DC143C] mx-auto mb-4"></div>
                        <p className="text-slate-400">Loading locations...</p>
                    </div>
                </div>
            )}
            
            {/* Location Board Content */}
            {!isLoading && (
                <>
                    {/* Header - Optional */}
                    {showHeader && (
                        <div className="p-4 pl-16 sm:pl-4 border-b flex items-center justify-between" style={{ borderColor: '#2C2C2E' }}>
                            <div>
                        <h2 className="text-xl sm:text-2xl font-bold" style={{ color: '#E5E7EB' }}>
                            Location Board
                        </h2>
                        <p className="text-xs sm:text-sm mt-1" style={{ color: '#9CA3AF' }}>
                            View and manage all locations from your screenplay
                        </p>
                    </div>
                    {canEditScript ? (
                        <button
                            onClick={() => {
                                setSelectedColumnType(null); // No specific column selected
                                setIsCreating(true);
                            }}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all hover:scale-105 shrink-0"
                            style={{
                                backgroundColor: '#8B5CF6',
                                color: 'white'
                            }}
                        >
                            <Plus size={18} />
                            <span className="hidden sm:inline">Add Location</span>
                            <span className="sm:hidden">Add</span>
                        </button>
                    ) : (
                        <span className="text-sm text-base-content/50">
                            Read-only access
                        </span>
                    )}
                </div>
            )}

            {/* Board - SIMPLIFIED (No Drag) */}
            <div className="flex-1 overflow-x-auto p-6">
                {/* Mobile: Vertical Stack, Desktop: 3 Columns */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
                    {columns.map((column) => (
                        <div key={column.id} className="flex flex-col min-w-0">
                            {/* Column Header - Modern Style */}
                            <div 
                                className="rounded-xl p-4 mb-3"
                                style={{ 
                                    background: `linear-gradient(135deg, ${column.color}20, ${column.color}10)`,
                                    borderLeft: `3px solid ${column.color}`,
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                }}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div 
                                            className="w-2 h-2 rounded-full animate-pulse"
                                            style={{ backgroundColor: column.color }}
                                        />
                                        <h3 className="font-bold text-base tracking-tight" style={{ color: '#E5E7EB' }}>
                                            {column.title}
                                        </h3>
                                    </div>
                                    <span 
                                        className="text-xs font-semibold px-2.5 py-1 rounded-full"
                                        style={{ 
                                            backgroundColor: column.color + '30',
                                            color: column.color
                                        }}
                                    >
                                        {column.locations.length}
                                    </span>
                                </div>
                            </div>

                            {/* Locations List (STATIC - No Drag) */}
                            <div className="flex-1 p-3 rounded-xl min-h-[400px] transition-all duration-200 border-2" style={{ backgroundColor: '#0A0A0B', borderColor: '#1C1C1E' }}>
                                {/* Empty State */}
                                {column.locations.length === 0 && (
                                    <div className="flex flex-col items-center justify-center h-full py-12 px-4">
                                        <div
                                            className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                                            style={{
                                                backgroundColor: column.color + '15',
                                                border: `2px dashed ${column.color}40`,
                                            }}
                                        >
                                            <MapPin size={28} style={{ color: column.color + '80' }} />
                                        </div>
                                        <p className="text-sm text-center" style={{ color: '#6B7280' }}>
                                            No locations yet
                                        </p>
                                        <p className="text-xs text-center mt-1 mb-4" style={{ color: '#4B5563' }}>
                                            Locations appear based on your screenplay
                                        </p>
                                        {/* 🔥 NEW: Add button in empty state */}
                                        <button
                                            onClick={() => {
                                                setSelectedColumnType(column.locationType); // Set the column type
                                                setIsCreating(true);
                                                setIsEditing(false);
                                                setSelectedLocation(null);
                                            }}
                                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105"
                                            style={{
                                                backgroundColor: column.color,
                                                color: 'white'
                                            }}
                                        >
                                            <Plus size={14} />
                                            Add {column.title}
                                        </button>
                                    </div>
                                )}

                                {/* Location Cards - STATIC */}
                                <div className="space-y-2">
                                    {column.locations.map((location, index) => (
                                        <motion.div
                                            key={location.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            onClick={() => setSelectedLocation(location)}
                                        >
                                            <LocationCardContent
                                                location={location}
                                                color={column.color}
                                                sceneCount={getLocationScenes(location.id).length}
                                                isInScript={isInScriptMap.get(location.id) || false}
                                                openEditForm={openEditForm}
                                                canEdit={canEditScript}
                                            />
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Location Detail Sidebar */}
            <AnimatePresence>
            {(isCreating || isEditing || selectedLocation) && (
                <>
                    {/* Backdrop - doesn't cover the sidebar area */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-background z-[9998] pointer-events-auto"
                        style={{ right: 'min(480px, 100vw)' }}
                        onClick={() => {
                            setIsCreating(false);
                            setIsEditing(false);
                            setSelectedLocation(null);
                        }}
                    />
                    
                    <LocationDetailSidebar
                        key={isCreating ? `create-${selectedColumnType || 'default'}` : `edit-${selectedLocation?.id || 'none'}`} // 🔥 FIX: Force remount when column type changes
                        location={isEditing || (!isCreating && selectedLocation) ? selectedLocation : null}
                        isCreating={isCreating}
                        initialData={isCreating ? {
                            ...initialData,
                            type: selectedColumnType || initialData?.type || 'INT' // 🔥 FIX: Use selected column type
                        } : undefined}
                        onClose={() => {
                            setIsCreating(false);
                            setIsEditing(false);
                            setSelectedLocation(null);
                            setSelectedColumnType(null); // 🔥 NEW: Clear selected column type
                        }}
                        onCreate={async (data) => {
                            try {
                                const { pendingImages, ...locationData } = data;
                                const newLocation = await createLocation(locationData);
                                
                                // 🔥 FIX: Set selectedLocation to newly created location so uploads work immediately
                                setSelectedLocation(newLocation);
                                
                                // Add pending images after location creation
                                // Images are already uploaded to S3 via presigned URLs, just need to register them
                                if (pendingImages && pendingImages.length > 0 && newLocation) {
                                    const token = await getToken({ template: 'wryda-backend' });
                                    if (token) {
                                        for (const img of pendingImages) {
                                            if (img.s3Key) {
                                                // Register image with location using direct S3 upload registration
                                                await fetch(
                                                    `/api/screenplays/${screenplayId}/locations/${newLocation.id}/images`,
                                                    {
                                                        method: 'POST',
                                                        headers: {
                                                            'Authorization': `Bearer ${token}`,
                                                            'Content-Type': 'application/json',
                                                        },
                                                        body: JSON.stringify({
                                                            s3Key: img.s3Key,
                                                            fileName: 'uploaded-image.jpg',
                                                            fileType: 'image/jpeg',
                                                            fileSize: 0,
                                                        }),
                                                    }
                                                );
                                            }
                                        }
                                        // Refresh location from context after images are registered
                                        await new Promise(resolve => setTimeout(resolve, 500));
                                        const updatedLocation = locations.find(l => l.id === newLocation.id);
                                        if (updatedLocation) {
                                            setSelectedLocation(updatedLocation);
                                        }
                                    }
                                }
                                
                                // 🔥 FIX: Don't close modal immediately - keep it open in edit mode so user can upload more images
                                setIsCreating(false);
                                setIsEditing(true);
                            } catch (err: any) {
                                alert(`Error creating location: ${err.message}`);
                            }
                        }}
                        onUpdate={async (location) => {
                            try {
                                await updateLocation(location.id, location);
                            } catch (err: any) {
                                alert(`Error updating location: ${err.message}`);
                            }
                        }}
                        onDelete={async (locationId) => {
                            const location = locations.find(l => l.id === locationId);
                            if (location) {
                                handleDelete(locationId, location.name);
                            }
                        }}
                        onSwitchToChatImageMode={onSwitchToChatImageMode}
                    />
                </>
            )}
            </AnimatePresence>
                </>
            )}
            
            {/* Delete Confirmation Dialog */}
            <DeleteLocationDialog
                location={locationToDelete}
                dependencyReport={deleteDependencyReport}
                sceneCount={deleteSceneCount}
                onConfirm={confirmDelete}
                onCancel={cancelDelete}
            />
        </div>
    );
}

// ============================================================================
// LocationCardContent Component (STATIC - No Drag)
// ============================================================================

interface LocationCardContentProps {
    location: Location;
    color: string;
    sceneCount: number;
    isInScript: boolean;
    openEditForm?: (location: Location) => void;
    canEdit: boolean;
}

function LocationCardContent({
    location,
    color,
    sceneCount,
    isInScript,
    openEditForm,
    canEdit,
}: LocationCardContentProps) {
    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        
        // Copy Fountain-formatted scene heading based on location type
        const locationTypePrefix = location.type === 'EXT' ? 'EXT' : location.type === 'INT/EXT' ? 'INT/EXT' : 'INT';
        const fountainText = `${locationTypePrefix}. ${location.name.toUpperCase()} - DAY\n\n`;
        
        navigator.clipboard.writeText(fountainText).then(() => {
            toast.success('Copied to clipboard! Paste in editor to insert scene heading');
        }).catch((err) => {
            console.error('Failed to copy:', err);
            toast.error('Failed to copy');
        });
    };

    return (
        <div
            className="mb-2 p-3 rounded-lg border cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02]"
            style={{
                backgroundColor: '#1C1C1E',
                borderColor: '#3F3F46',
            }}
        >
            {/* Location Info */}
            <div className="flex items-start gap-2">
                <div
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                    style={{
                        backgroundColor: color + '30',
                        color: color,
                    }}
                >
                    <MapPin size={16} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h4 className="font-medium truncate" style={{ color: '#E5E7EB' }}>
                            {location.name}
                        </h4>
                        {!isInScript && (
                            <span
                                className="px-1.5 py-0.5 rounded text-xs font-medium"
                                style={{
                                    backgroundColor: '#6B7280',
                                    color: '#E5E7EB',
                                }}
                                title="This location hasn't appeared in the script yet"
                            >
                                Not in script
                            </span>
                        )}
                    </div>
                    <p className="text-xs truncate" style={{ color: '#9CA3AF' }}>
                        {location.type}
                    </p>
                </div>
                {openEditForm && (
                    <div className="flex items-center gap-1">
                        <button
                            onClick={handleCopy}
                            className="p-1 rounded hover:bg-base-content/20 transition-colors"
                            style={{ color: '#9CA3AF' }}
                            title="Copy Fountain format to clipboard"
                        >
                            <Copy size={14} />
                        </button>
                        {canEdit && openEditForm && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    openEditForm(location);
                                }}
                                className="p-1 rounded hover:bg-base-content/20 transition-colors"
                                style={{ color: '#9CA3AF' }}
                                title="Edit location"
                            >
                                <MoreVertical size={14} />
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Description */}
            {location.description && (
                <p className="text-xs mt-2 line-clamp-2" style={{ color: '#6B7280' }}>
                    {location.description}
                </p>
            )}

            {/* Stats */}
            <div className="flex items-center gap-3 mt-2 text-xs" style={{ color: '#6B7280' }}>
                <span className="flex items-center gap-1">
                    <Film size={12} />
                    {sceneCount} scenes
                </span>
                {location.images && location.images.length > 0 && (
                    <span className="text-blue-400">🖼️ {location.images.length}</span>
                )}
                {location.githubIssueNumber && <span>🔗 #{location.githubIssueNumber}</span>}
            </div>

            {/* Address Tag */}
            {location.address && (
                <div
                    className="mt-2 text-xs px-2 py-1 rounded"
                    style={{
                        backgroundColor: '#2C2C2E',
                        color: '#9CA3AF',
                    }}
                >
                    📍 {location.address}
                </div>
            )}
        </div>
    );
}
