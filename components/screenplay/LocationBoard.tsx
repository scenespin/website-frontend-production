'use client';

import { useState, useEffect } from 'react';
import { Plus, MapPin, Film, MoreVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import type { Location, LocationType } from '@/types/screenplay';
import LocationDetailSidebar from './LocationDetailSidebar';
import { DeleteLocationDialog } from '../structure/DeleteConfirmDialog';
import { getLocationDependencies, generateLocationReport } from '@/utils/dependencyChecker';

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
    const { locations, updateLocation, createLocation, deleteLocation, getLocationScenes, beats, relationships } = useScreenplay();
    const [columns, setColumns] = useState<LocationColumn[]>([]);
    const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
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
    }, [locations]);

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
                    <button
                        onClick={() => setIsCreating(true)}
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
                                className="rounded-xl p-4 mb-3 backdrop-blur-sm"
                                style={{ 
                                    background: `linear-gradient(135deg, ${column.color}15, ${column.color}05)`,
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
                                        <p className="text-xs text-center mt-1" style={{ color: '#4B5563' }}>
                                            Locations appear based on your screenplay
                                        </p>
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
                                                openEditForm={openEditForm}
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
                        location={isEditing || (!isCreating && selectedLocation) ? selectedLocation : null}
                        isCreating={isCreating}
                        initialData={isCreating ? initialData : undefined}
                        onClose={() => {
                            setIsCreating(false);
                            setIsEditing(false);
                            setSelectedLocation(null);
                        }}
                        onCreate={async (data) => {
                            try {
                                await createLocation(data);
                                setIsCreating(false);
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
    openEditForm?: (location: Location) => void;
}

function LocationCardContent({
    location,
    color,
    sceneCount,
    openEditForm,
}: LocationCardContentProps) {
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
                    <h4 className="font-medium truncate" style={{ color: '#E5E7EB' }}>
                        {location.name}
                    </h4>
                    <p className="text-xs truncate" style={{ color: '#9CA3AF' }}>
                        {location.type}
                    </p>
                </div>
                {openEditForm && (
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
