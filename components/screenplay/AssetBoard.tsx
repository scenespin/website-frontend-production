'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, Package, MoreVertical, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { useQueryClient } from '@tanstack/react-query'
import { invalidateProductionHubCache } from '@/utils/cacheInvalidation';
import { useEditor } from '@/contexts/EditorContext';
import type { Asset, AssetCategory } from '@/types/asset';
import AssetDetailSidebar from './AssetDetailSidebar';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useMediaFiles } from '@/hooks/useMediaLibrary';

interface AssetColumn {
    id: string;
    title: string;
    category: AssetCategory;
    assets: Asset[];
    color: string;
}

interface AssetBoardProps {
    showHeader?: boolean;
    triggerAdd?: boolean;
    initialData?: any;
    onSwitchToChatImageMode?: (modelId?: string, entityContext?: { type: string; id: string; name: string; workflow?: string }) => void;
}

export default function AssetBoard({ showHeader = true, triggerAdd, initialData, onSwitchToChatImageMode }: AssetBoardProps) {
    const { 
        assets, 
        updateAsset, 
        createAsset, 
        deleteAsset, 
        getAssetScenes, 
        isLoading, 
        hasInitializedFromDynamoDB, 
        isEntityInScript, 
        addImageToEntity,
        canEditScript,
        canUseAI,
        screenplayId,
        batchUpdatePropAssociations
    } = useScreenplay();
    const queryClient = useQueryClient();
    const { state: editorState } = useEditor();
    const [columns, setColumns] = useState<AssetColumn[]>([]);
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedColumnCategory, setSelectedColumnCategory] = useState<AssetCategory | null>(null);
    
    // 🔥 Feature 0200: Query Media Library for asset image counts (source of truth)
    // This replaces counting from asset.images[] which may contain expired references
    const { data: allAssetMediaFiles = [] } = useMediaFiles(
        screenplayId || '',
        undefined,
        !!screenplayId,
        true, // includeAllFolders
        'asset' // entityType - get all asset media files
    );
    
    // Create a map of assetId → valid image count
    const assetImageCountMap = useMemo(() => {
        const countMap = new Map<string, number>();
        allAssetMediaFiles.forEach((file: any) => {
            if (file.entityId && file.s3Key && !file.s3Key.startsWith('thumbnails/')) {
                // Only count creation images (not angle-generation from Production Hub)
                const source = file.metadata?.source;
                if (source !== 'angle-generation') {
                    const current = countMap.get(file.entityId) || 0;
                    countMap.set(file.entityId, current + 1);
                }
            }
        });
        return countMap;
    }, [allAssetMediaFiles]);
    
    // 🔥 FIX: Sync selectedAsset with latest asset from context (for immediate UI updates)
    useEffect(() => {
        if (selectedAsset?.id) {
            const updatedAsset = assets.find(a => a.id === selectedAsset.id);
            if (updatedAsset) {
                setSelectedAsset(updatedAsset);
            }
        }
    }, [assets, selectedAsset?.id])
    
    // Delete confirmation state
    const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null);
    
    // Memoize isInScript checks to prevent render loops
    const scriptContent = editorState.content;
    const isInScriptMap = useMemo(() => {
        const map = new Map<string, boolean>();
        assets.forEach(asset => {
            map.set(asset.id, isEntityInScript(scriptContent, asset.name, 'asset'));
        });
        return map;
    }, [assets, scriptContent, isEntityInScript]);
    
    // Listen for external trigger to add asset
    useEffect(() => {
        if (triggerAdd) {
            setIsCreating(true);
            setIsEditing(false);
            setSelectedAsset(null);
        }
    }, [triggerAdd]);

    // Initialize columns based on asset categories
    useEffect(() => {
        console.log('[AssetBoard] 🔄 Assets changed:', assets.length, 'total');
        console.log('[AssetBoard] 🔍 Asset names:', assets.map(a => a.name));
        console.log('[AssetBoard] 📊 Loading state:', { isLoading, hasInitializedFromDynamoDB });
        
        const props = assets.filter(a => a.category === 'prop');
        const vehicles = assets.filter(a => a.category === 'vehicle');
        const furniture = assets.filter(a => a.category === 'furniture');
        const other = assets.filter(a => a.category === 'other');

        const newColumns: AssetColumn[] = [
            {
                id: 'col-prop',
                title: 'Props',
                category: 'prop',
                assets: props,
                color: '#3B82F6' // Blue
            },
            {
                id: 'col-vehicle',
                title: 'Vehicles',
                category: 'vehicle',
                assets: vehicles,
                color: '#10B981' // Green
            },
            {
                id: 'col-furniture',
                title: 'Furniture',
                category: 'furniture',
                assets: furniture,
                color: '#F59E0B' // Orange
            },
            {
                id: 'col-other',
                title: 'Other',
                category: 'other',
                assets: other,
                color: '#8B5CF6' // Purple
            }
        ];

        setColumns(newColumns);
    }, [assets, isLoading, hasInitializedFromDynamoDB]);

    const handleDelete = async (assetId: string, assetName: string) => {
        const asset = assets.find(a => a.id === assetId);
        if (!asset) return;
        
        // Check if asset is used in scenes
        const sceneIds = getAssetScenes(assetId);
        
        if (sceneIds.length > 0) {
            const confirmMessage = `Asset "${assetName}" is used in ${sceneIds.length} scene(s). Are you sure you want to delete it?`;
            if (!window.confirm(confirmMessage)) {
                return;
            }
        }
        
        // Show delete confirmation
        setAssetToDelete(asset);
    };
    
    const confirmDelete = async () => {
        if (!assetToDelete) return;
        
        try {
            await deleteAsset(assetToDelete.id);
            setAssetToDelete(null);
            setSelectedAsset(null);
            toast.success('Asset deleted successfully');
        } catch (err: any) {
            toast.error(`Error deleting asset: ${err.message}`);
        }
    };
    
    const cancelDelete = () => {
        setAssetToDelete(null);
    };

    const openEditForm = (asset: Asset) => {
        setSelectedAsset(asset);
        setIsEditing(true);
    };

    return (
        <div className="flex flex-col h-full" style={{ backgroundColor: '#0A0A0A' }}>
            {/* Loading State */}
            {isLoading && (
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#DC143C] mx-auto mb-4"></div>
                        <p className="text-slate-400">Loading assets...</p>
                    </div>
                </div>
            )}
            
            {/* Asset Board Content */}
            {!isLoading && (
                <>
                    {/* Header */}
                    {showHeader && (
                        <div className="mb-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold" style={{ color: '#E5E7EB' }}>
                                        Props Board
                                    </h2>
                                    <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>
                                        View and manage all props from your screenplay
                                    </p>
                                </div>
                            {canEditScript ? (
                                <button
                                    onClick={() => {
                                        setSelectedColumnCategory(null);
                                        setIsCreating(true);
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all hover:scale-105 shrink-0"
                                    style={{
                                        backgroundColor: '#DC143C',
                                        color: 'white'
                                    }}
                                >
                                    <Plus size={18} />
                                    <span className="hidden sm:inline">Add Asset</span>
                                    <span className="sm:hidden">Add</span>
                                </button>
                            ) : (
                                <span className="text-sm text-base-content/50">
                                    Read-only access
                                </span>
                            )}
                            </div>
                        </div>
                    )}

                    {/* Board - 4 Columns for Categories */}
                    <div className="flex-1 overflow-x-auto p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-full">
                            {columns.map((column) => (
                                <div key={column.id} className="flex flex-col min-w-0">
                                    {/* Column Header */}
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
                                                {column.assets.length}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Assets List */}
                                    <div className="flex-1 p-3 rounded-xl min-h-[400px] transition-all duration-200 border-2" style={{ backgroundColor: '#0A0A0A', borderColor: '#0A0A0A' }}>
                                        {/* Empty State */}
                                        {column.assets.length === 0 && (
                                            <div className="flex flex-col items-center justify-center h-full py-12 px-4">
                                                <div
                                                    className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                                                    style={{
                                                        backgroundColor: column.color + '15',
                                                        border: `2px dashed ${column.color}40`,
                                                    }}
                                                >
                                                    <Package size={28} style={{ color: column.color + '80' }} />
                                                </div>
                                                <p className="text-sm text-center" style={{ color: '#6B7280' }}>
                                                    No {column.title.toLowerCase()} yet
                                                </p>
                                                <p className="text-xs text-center mt-1 mb-4" style={{ color: '#4B5563' }}>
                                                    {column.title} appear based on your screenplay
                                                </p>
                                                <button
                                                    onClick={() => {
                                                        setSelectedColumnCategory(column.category);
                                                        setIsCreating(true);
                                                        setIsEditing(false);
                                                        setSelectedAsset(null);
                                                    }}
                                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105"
                                                    style={{
                                                        backgroundColor: column.color,
                                                        color: 'white'
                                                    }}
                                                >
                                                    <Plus size={14} />
                                                    Add {column.title.slice(0, -1)}
                                                </button>
                                            </div>
                                        )}

                                        {/* Asset Cards */}
                                        <div className="space-y-2">
                                            {column.assets.map((asset, index) => (
                                                <motion.div
                                                    key={asset.id}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    onClick={() => setSelectedAsset(asset)}
                                                >
                                                    <AssetCardContent
                                                        asset={asset}
                                                        color={column.color}
                                                        sceneCount={getAssetScenes(asset.id).length}
                                                        isInScript={isInScriptMap.get(asset.id) || false}
                                                        openEditForm={openEditForm}
                                                        canEdit={canEditScript}
                                                        assetImageCountMap={assetImageCountMap}
                                                    />
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Asset Detail Sidebar */}
                    <AnimatePresence>
                        {(isCreating || isEditing || selectedAsset) && (
                            <>
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
                                        setSelectedAsset(null);
                                    }}
                                />
                                
                                <AssetDetailSidebar
                                    key={isCreating ? `create-${selectedColumnCategory || 'default'}` : `edit-${selectedAsset?.id || 'none'}`}
                                    asset={isEditing || (!isCreating && selectedAsset) ? selectedAsset : null}
                                    isCreating={isCreating}
                                    initialData={isCreating ? {
                                        ...initialData,
                                        category: selectedColumnCategory || initialData?.category || 'prop'
                                    } : undefined}
                                    onClose={() => {
                                        setIsCreating(false);
                                        setIsEditing(false);
                                        setSelectedAsset(null);
                                        setSelectedColumnCategory(null);
                                    }}
                                    onCreate={async (data) => {
                                        try {
                                            const { pendingImages, selectedSceneIds, ...assetData } = data;
                                            const newAsset = await createAsset({
                                                name: assetData.name,
                                                category: assetData.category,
                                                description: assetData.description,
                                                tags: assetData.tags || []
                                            });
                                            
                                            // 🔥 FIX: Refetch Production Hub asset cache so new asset appears immediately
                                            if (screenplayId) {
                                                // Use aggressive cache invalidation pattern (matches locations pattern)
                                                invalidateProductionHubCache(queryClient, 'assets', screenplayId);
                                            }
                                            
                                            // 🔥 FIX: Apply scene associations after asset creation
                                            if (selectedSceneIds && Array.isArray(selectedSceneIds) && selectedSceneIds.length > 0 && newAsset) {
                                                try {
                                                    console.log('[AssetBoard] 🔗 Applying scene associations after creation:', {
                                                        assetId: newAsset.id,
                                                        sceneCount: selectedSceneIds.length
                                                    });
                                                    await batchUpdatePropAssociations(
                                                        newAsset.id,
                                                        selectedSceneIds, // Link to these scenes
                                                        [] // No unlinks during creation
                                                    );
                                                    console.log('[AssetBoard] ✅ Scene associations applied successfully');
                                                } catch (sceneError: any) {
                                                    console.error('[AssetBoard] ⚠️ Failed to apply scene associations (non-critical):', sceneError);
                                                    // Don't fail asset creation if scene associations fail
                                                }
                                            }
                                            
                                            // Add pending images after asset creation
                                            // Images are already uploaded to S3 via presigned URLs, just need to register them
                                            if (pendingImages && pendingImages.length > 0 && newAsset) {
                                                const imageEntries = [];
                                                
                                                for (const img of pendingImages) {
                                                    try {
                                                        if (img.s3Key) {
                                                            // Image already uploaded to S3, just register it
                                                            // 🔥 FIX: Store s3Key so we can regenerate presigned URLs when they expire
                                                            imageEntries.push({
                                                                url: img.imageUrl, // This is the presigned download URL (7-day expiration)
                                                                uploadedAt: new Date().toISOString(),
                                                                s3Key: img.s3Key // Store s3Key for URL regeneration
                                                            });
                                                        } else {
                                                            // AI-generated image (data URL) - needs to be uploaded to S3
                                                            // This case should be rare now, but handle it for backward compatibility
                                                            const response = await fetch(img.imageUrl);
                                                            const blob = await response.blob();
                                                            const file = new File([blob], 'asset-image.png', { type: 'image/png' });
                                                            
                                                            const formData = new FormData();
                                                            formData.append('image', file);
                                                            
                                                            await api.assetBank.uploadImage(newAsset.id, formData, 'creation'); // Creation section context
                                                        }
                                                    } catch (uploadError: any) {
                                                        console.error('Failed to process image:', uploadError);
                                                        // Continue with other images even if one fails
                                                    }
                                                }
                                                
                                                // 🔥 FIX: Use the real asset ID directly from createAsset return value
                                                // Don't look it up in state - the state replacement is asynchronous
                                                // newAsset is the real asset from DynamoDB with the correct ID
                                                if (imageEntries.length > 0) {
                                                    console.log('[AssetBoard] 📸 Registering', imageEntries.length, 'images with asset:', newAsset.id);
                                                    
                                                    // Transform imageEntries to AssetImage format
                                                    const newImageObjects = imageEntries.map(img => ({
                                                        url: img.imageUrl,
                                                        uploadedAt: new Date().toISOString(),
                                                        s3Key: img.s3Key
                                                    }));
                                                    
                                                    const updatedImages = [
                                                        ...(newAsset.images || []),
                                                        ...newImageObjects
                                                    ];
                                                    
                                                    // 🔥 CRITICAL: Optimistically update React Query cache BEFORE API call
                                                    // This ensures Production Hub card shows image immediately
                                                    if (screenplayId) {
                                                        const queryKey = ['assets', screenplayId, 'production-hub'];
                                                        const queryState = queryClient.getQueryState(queryKey);
                                                        const isQueryActive = queryState?.status === 'success' || queryState?.dataUpdatedAt !== undefined;
                                                        
                                                        // Initialize cache if empty
                                                        let cacheBefore = queryClient.getQueryData<Asset[]>(queryKey);
                                                        if (!cacheBefore) {
                                                            const allAssets = assets.map(a => ({ ...a }));
                                                            cacheBefore = allAssets;
                                                            queryClient.setQueryData<Asset[]>(queryKey, allAssets);
                                                        }
                                                        
                                                        // Optimistically update cache
                                                        queryClient.setQueryData<Asset[]>(queryKey, (old) => {
                                                            if (!old || !Array.isArray(old)) {
                                                                return [{
                                                                    ...newAsset,
                                                                    images: updatedImages
                                                                }];
                                                            }
                                                            
                                                            return old.map(a => {
                                                                if (a.id === newAsset.id) {
                                                                    return {
                                                                        ...a,
                                                                        images: updatedImages,
                                                                        angleReferences: a.angleReferences ? [...(a.angleReferences || [])] : undefined
                                                                    };
                                                                }
                                                                return { ...a };
                                                            });
                                                        });
                                                        
                                                        console.log('[AssetBoard] ✅ Optimistically updated React Query cache:', {
                                                            assetId: newAsset.id,
                                                            imageCount: updatedImages.length,
                                                            isQueryActive
                                                        });
                                                        
                                                        // If query is active, trigger immediate re-render
                                                        if (isQueryActive) {
                                                            queryClient.refetchQueries({
                                                                queryKey,
                                                                type: 'active'
                                                            });
                                                        }
                                                    }
                                                    
                                                    // Use updateAsset directly (like characters/locations do)
                                                    // This handles both backend update AND context sync in one call
                                                    // 🔥 FIX: Add small delay for DynamoDB eventual consistency after asset creation
                                                    await new Promise(resolve => setTimeout(resolve, 300));
                                                    await updateAsset(newAsset.id, {
                                                        images: updatedImages
                                                    });
                                                    console.log('[AssetBoard] ✅ Images registered successfully via updateAsset');
                                                    
                                                    // Invalidate and refetch after delay (but don't remove - preserves optimistic update)
                                                    if (screenplayId) {
                                                        queryClient.invalidateQueries({ queryKey: ['media', 'files', screenplayId] });
                                                        queryClient.invalidateQueries({ queryKey: ['assets', screenplayId, 'production-hub'] });
                                                        setTimeout(() => {
                                                            queryClient.refetchQueries({
                                                                queryKey: ['assets', screenplayId, 'production-hub'],
                                                                type: 'active'
                                                            });
                                                        }, 2000);
                                                    }
                                                    
                                                    // 🔥 FIX: Refresh asset from context after images are registered
                                                    // Wait a bit for backend processing and context update
                                                    await new Promise(resolve => setTimeout(resolve, 500));
                                                    const updatedAsset = assets.find(a => a.id === newAsset.id);
                                                    if (updatedAsset) {
                                                        setSelectedAsset(updatedAsset);
                                                    } else {
                                                        setSelectedAsset(newAsset);
                                                    }
                                                }
                                            } else {
                                                // No pending images - just set the new asset
                                                setSelectedAsset(newAsset);
                                            }
                                            
                                            // 🔥 FIX: Keep sidebar open with newly created asset so uploads work immediately
                                            // Match Character pattern: set selectedAsset and close creating mode
                                            setIsCreating(false);
                                            setIsEditing(false); // Don't set isEditing - just close creating mode
                                            toast.success('Asset created successfully');
                                        } catch (err: any) {
                                            toast.error(`Error creating asset: ${err.message}`);
                                        }
                                    }}
                                    onUpdate={async (asset) => {
                                        try {
                                            await updateAsset(asset.id, asset);
                                            toast.success('Asset updated successfully');
                                        } catch (err: any) {
                                            toast.error(`Error updating asset: ${err.message}`);
                                        }
                                    }}
                                    onDelete={async (assetId) => {
                                        const asset = assets.find(a => a.id === assetId);
                                        if (asset) {
                                            handleDelete(assetId, asset.name);
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
            {assetToDelete && (
                <div className="fixed inset-0 bg-black/50 z-[10000] flex items-center justify-center">
                    <div className="bg-[#0A0A0A] rounded-lg p-6 max-w-md w-full mx-4 border border-[#2C2C2E]">
                        <h3 className="text-lg font-bold mb-2" style={{ color: '#E5E7EB' }}>
                            Delete Asset?
                        </h3>
                        <p className="text-sm mb-4" style={{ color: '#9CA3AF' }}>
                            Are you sure you want to delete "{assetToDelete.name}"? This action cannot be undone.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={cancelDelete}
                                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                style={{
                                    backgroundColor: '#2C2C2E',
                                    color: '#E5E7EB'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                style={{
                                    backgroundColor: '#DC143C',
                                    color: 'white'
                                }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ============================================================================
// AssetCardContent Component
// ============================================================================

interface AssetCardContentProps {
    asset: Asset;
    color: string;
    sceneCount: number;
    isInScript: boolean;
    openEditForm?: (asset: Asset) => void;
    canEdit: boolean;
    assetImageCountMap: Map<string, number>; // 🔥 Feature 0200: Media Library image counts
}

function AssetCardContent({
    asset,
    color,
    sceneCount,
    isInScript,
    openEditForm,
    canEdit,
    assetImageCountMap,
}: AssetCardContentProps) {
    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        
        // Copy asset name in ALL CAPS (for screenplay format)
        const fountainText = asset.name.toUpperCase();
        
        navigator.clipboard.writeText(fountainText).then(() => {
            toast.success('Copied to clipboard!');
        }).catch((err) => {
            console.error('Failed to copy:', err);
            toast.error('Failed to copy');
        });
    };

    return (
        <div
            className="mb-2 p-3 rounded-lg border cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02]"
            style={{
                backgroundColor: '#0A0A0A',
                borderColor: '#1C1C1E',
            }}
        >
            {/* Asset Info */}
            <div className="flex items-start gap-2">
                <div
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                    style={{
                        backgroundColor: color + '30',
                        color: color,
                    }}
                >
                    <Package size={16} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h4 className="font-medium truncate" style={{ color: '#E5E7EB' }}>
                            {asset.name}
                        </h4>
                        {!isInScript && (
                            <span
                                className="px-1.5 py-0.5 rounded text-xs font-medium"
                                style={{
                                    backgroundColor: '#6B7280',
                                    color: '#E5E7EB',
                                }}
                                title="This asset hasn't appeared in the script yet"
                            >
                                Not in script
                            </span>
                        )}
                    </div>
                    <p className="text-xs truncate capitalize" style={{ color: '#9CA3AF' }}>
                        {asset.category}
                    </p>
                </div>
                {openEditForm && (
                    <div className="flex items-center gap-1">
                        <button
                            onClick={handleCopy}
                            className="p-1 rounded hover:bg-base-content/20 transition-colors"
                            style={{ color: '#9CA3AF' }}
                            title="Copy asset name to clipboard"
                        >
                            <Copy size={14} />
                        </button>
                        {canEdit && openEditForm && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    openEditForm(asset);
                                }}
                                className="p-1 rounded hover:bg-base-content/20 transition-colors"
                                style={{ color: '#9CA3AF' }}
                                title="Edit asset"
                            >
                                <MoreVertical size={14} />
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Description */}
            {asset.description && (
                <p className="text-xs mt-2 line-clamp-2" style={{ color: '#6B7280' }}>
                    {asset.description}
                </p>
            )}

            {/* Stats */}
            <div className="flex items-center gap-3 mt-2 text-xs" style={{ color: '#6B7280' }}>
                <span className="flex items-center gap-1">
                    📝 {sceneCount} {sceneCount === 1 ? 'scene' : 'scenes'}
                </span>
                {(() => {
                    // 🔥 Feature 0200: Use Media Library count (source of truth)
                    // This prevents showing counts for expired/deleted images
                    const imageCount = assetImageCountMap.get(asset.id) || 0;
                    return imageCount > 0 ? (
                        <span className="text-blue-400">🖼️ {imageCount}</span>
                    ) : null;
                })()}
            </div>

            {/* Tags */}
            {asset.tags && asset.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                    {asset.tags.slice(0, 3).map((tag, idx) => (
                        <span
                            key={idx}
                            className="text-xs px-2 py-0.5 rounded"
                            style={{
                                backgroundColor: '#2C2C2E',
                                color: '#9CA3AF',
                            }}
                        >
                            {tag}
                        </span>
                    ))}
                    {asset.tags.length > 3 && (
                        <span className="text-xs" style={{ color: '#6B7280' }}>
                            +{asset.tags.length - 3}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}

