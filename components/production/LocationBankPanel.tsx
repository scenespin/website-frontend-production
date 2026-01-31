'use client';

/**
 * Location Bank Panel - Simplified React Query Version
 * 
 * Production Hub Simplification Plan - Phase 1
 * Reduced from ~358 lines to ~200 lines using React Query
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@clerk/nextjs';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { useQueryClient } from '@tanstack/react-query';
import { CinemaCard, type CinemaCardImage } from './CinemaCard';
import { LocationDetailModal } from './LocationDetailModal';
import LocationAngleGenerationModal from './LocationAngleGenerationModal';
import { useLocations, type LocationProfile } from '@/hooks/useLocationBank';
import { useMediaFiles, useBulkPresignedUrls, useDropboxPreviewUrls } from '@/hooks/useMediaLibrary';
import { getMediaFileDisplayUrl } from './utils/imageUrlResolver';

interface LocationBankPanelProps {
  className?: string;
  locations?: LocationProfile[];
  isLoading?: boolean;
  onLocationsUpdate?: () => void;
  entityToOpen?: string | null; // Location ID to open modal for
  onEntityOpened?: () => void; // Callback when entity modal is opened
}

export function LocationBankPanel({
  className = '',
  locations: propsLocations = [],
  isLoading: propsIsLoading = false,
  onLocationsUpdate,
  entityToOpen,
  onEntityOpened
}: LocationBankPanelProps) {
  const screenplay = useScreenplay();
  const screenplayId = screenplay.screenplayId;
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  // React Query for fetching locations - Production Hub context
  const { data: locations = propsLocations, isLoading: queryLoading } = useLocations(
    screenplayId || '',
    'production-hub', // 🔥 FIX: Use production-hub context to separate from Creation section
    !!screenplayId
  );

  // 🔥 Feature 0200: Query Media Library for all location files (source of truth for cards)
  // This matches the pattern used by LocationDetailModal - ensures cards and modals show same data
  const { data: allLocationMediaFiles = [] } = useMediaFiles(
    screenplayId || '',
    undefined, // no folder filter
    !!screenplayId, // enabled
    true, // includeAllFolders
    'location' // entityType - get all location files
  );

  // 🔥 Feature 0200: Process Media Library files to get angles and backgrounds per location
  // This is the same logic used in LocationDetailModal - ensures consistency
  // 🔥 FIX: Use creationImages ARRAY instead of single baseReference (matches AssetBankPanel pattern)
  const locationImagesFromMediaLibrary = useMemo(() => {
    const locationMap: Record<string, {
      creationImages: Array<{ s3Key: string; label?: string; isBase?: boolean }>;
      angles: Array<{ s3Key: string; angle?: string; label?: string }>;
      backgrounds: Array<{ s3Key: string; backgroundType?: string }>;
    }> = {};

    allLocationMediaFiles.forEach((file: any) => {
      if (!file.s3Key || file.s3Key.startsWith('thumbnails/')) return;
      
      const entityId = file.metadata?.entityId || file.entityId;
      if (!entityId) return;

      if (!locationMap[entityId]) {
        locationMap[entityId] = { creationImages: [], angles: [], backgrounds: [] };
      }

      // Check if it's a background
      const hasAngleMetadata = file.metadata?.angle !== undefined;
      const isBackground = !hasAngleMetadata && (
        file.metadata?.isBackground === true ||
        file.metadata?.source === 'background-generation' ||
        file.metadata?.backgroundType !== undefined
      );

      if (isBackground) {
        locationMap[entityId].backgrounds.push({
          s3Key: file.s3Key,
          backgroundType: file.metadata?.backgroundType
        });
      } else if (hasAngleMetadata || file.metadata?.sourceType === 'angle-variations') {
        // Angle variation
        locationMap[entityId].angles.push({
          s3Key: file.s3Key,
          angle: file.metadata?.angle,
          label: file.metadata?.angle
        });
      } else if (file.metadata?.isBase || file.metadata?.source === 'user-upload') {
        // 🔥 FIX: Push to array instead of overwriting (matches AssetBankPanel pattern)
        // This ensures ALL creation images are displayed, not just the last one
        const isBase = file.metadata?.isBase === true;
        locationMap[entityId].creationImages.push({
          s3Key: file.s3Key,
          label: file.fileName?.replace(/\.[^/.]+$/, '') || 'Image',
          isBase
        });
      }
    });

    return locationMap;
  }, [allLocationMediaFiles]);

  // 🔥 Feature 0200: Get all s3Keys for presigned URL generation
  const allLocationS3Keys = useMemo(() => {
    const keys: string[] = [];
    Object.values(locationImagesFromMediaLibrary).forEach(loc => {
      // 🔥 FIX: Iterate over creationImages array (matches AssetBankPanel pattern)
      loc.creationImages.forEach(img => keys.push(img.s3Key));
      loc.angles.forEach(a => keys.push(a.s3Key));
      loc.backgrounds.forEach(b => keys.push(b.s3Key));
    });
    return keys;
  }, [locationImagesFromMediaLibrary]);

  // 🔥 Feature 0200: Generate presigned URLs for all location images
  const { data: locationPresignedUrls = new Map() } = useBulkPresignedUrls(
    allLocationS3Keys,
    !!screenplayId && allLocationS3Keys.length > 0
  );
  const dropboxUrlMap = useDropboxPreviewUrls(allLocationMediaFiles, !!screenplayId && allLocationMediaFiles.length > 0);
  const locationMediaFileMap = useMemo(() => {
    const map = new Map<string, any>();
    allLocationMediaFiles.forEach((file: any) => {
      if (file.s3Key && !file.s3Key.startsWith('thumbnails/')) map.set(file.s3Key, file);
    });
    return map;
  }, [allLocationMediaFiles]);
  const presignedMapsForDisplay = useMemo(() => ({
    fullImageUrlsMap: locationPresignedUrls,
    thumbnailS3KeyMap: null as Map<string, string> | null,
    thumbnailUrlsMap: null as Map<string, string> | null,
  }), [locationPresignedUrls]);

  const getLocationImageDisplayUrl = useCallback((s3Key: string) => {
    const file = locationMediaFileMap.get(s3Key);
    return getMediaFileDisplayUrl(
      file ?? { id: s3Key, storageType: 'local', s3Key } as any,
      presignedMapsForDisplay,
      dropboxUrlMap
    );
  }, [locationMediaFileMap, presignedMapsForDisplay, dropboxUrlMap]);

  // 🔥 FIX: Calculate backgrounds count per location from Media Library (source of truth)
  const backgroundsCountByLocation = useMemo(() => {
    const counts: Record<string, number> = {};
    
    Object.entries(locationImagesFromMediaLibrary).forEach(([entityId, loc]) => {
      const validBackgrounds = loc.backgrounds.filter(bg => !!getLocationImageDisplayUrl(bg.s3Key));
      if (validBackgrounds.length > 0) {
        counts[entityId] = validBackgrounds.length;
      }
    });
    return counts;
  }, [locationImagesFromMediaLibrary, getLocationImageDisplayUrl]);

  const isLoading = queryLoading || propsIsLoading;

  // Local UI state only
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [showLocationDetail, setShowLocationDetail] = useState(false);
  const [showAngleModal, setShowAngleModal] = useState(false);
  const [angleLocation, setAngleLocation] = useState<LocationProfile | null>(null);

  // Auto-open modal when entityToOpen is set
  useEffect(() => {
    if (entityToOpen && !showLocationDetail) {
      const location = locations.find(l => l.locationId === entityToOpen);
      if (location) {
        setSelectedLocationId(entityToOpen);
        setShowLocationDetail(true);
        onEntityOpened?.();
      }
    }
  }, [entityToOpen, locations, showLocationDetail, onEntityOpened]);

  // Early return after all hooks
  if (!screenplayId) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-gray-400 text-sm">Loading locations...</p>
        </div>
      </div>
    );
  }

  // Helper functions
  function handleGenerateAngles(locationId: string) {
    const location = locations.find(l => l.locationId === locationId);
    if (location) {
      setAngleLocation(location);
      setShowAngleModal(true);
    }
  }

  async function updateLocation(locationId: string, updates: Partial<LocationProfile>) {
    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) throw new Error('Not authenticated');

      const apiUpdates: any = {};
      
      if (updates.angleVariations !== undefined) {
        apiUpdates.angleVariations = updates.angleVariations;
      }
      if (updates.name !== undefined) apiUpdates.name = updates.name;
      if (updates.description !== undefined) apiUpdates.description = updates.description;
      if (updates.type !== undefined) apiUpdates.type = updates.type;

      const response = await fetch(`/api/location-bank/${locationId}?screenplayId=${encodeURIComponent(screenplayId)}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiUpdates),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to update location: ${response.status}`);
      }

      toast.success('Location updated successfully');
      
      // Check cache before invalidation
      const cacheBeforeInvalidate = queryClient.getQueryData<any[]>(['locations', screenplayId, 'production-hub']);
      console.log('[LocationBankPanel] 📊 Cache before invalidation:', {
        hasData: !!cacheBeforeInvalidate,
        locationCount: cacheBeforeInvalidate?.length,
        updatedLocation: cacheBeforeInvalidate?.find(l => l.locationId === locationId),
        backgroundsCount: cacheBeforeInvalidate?.find(l => l.locationId === locationId)?.backgrounds?.length
      });
      
      // 🔥 FIX: Use same aggressive pattern as CharacterBankPanel and LocationDetailModal (works!)
      // removeQueries + invalidateQueries + setTimeout refetchQueries with type: 'active'
      // This ensures disabled queries don't block invalidation (see GitHub issue #947)
      // Also invalidate presigned URLs so new images get fresh URLs
      console.log('[LocationBankPanel] 🔄 Invalidating locations cache');
      queryClient.removeQueries({ queryKey: ['locations', screenplayId, 'production-hub'] });
      queryClient.invalidateQueries({ queryKey: ['locations', screenplayId, 'production-hub'] });
      queryClient.invalidateQueries({ 
        queryKey: ['media', 'files', screenplayId],
        exact: false
      });
      queryClient.invalidateQueries({ 
        queryKey: ['media', 'presigned-urls'],
        exact: false // Invalidate all presigned URL queries (they have dynamic keys)
      });
      setTimeout(() => {
        queryClient.refetchQueries({ 
          queryKey: ['locations', screenplayId, 'production-hub'],
          type: 'active' // Only refetch active (enabled) queries
        });
        queryClient.refetchQueries({ 
          queryKey: ['media', 'files', screenplayId],
          exact: false
        });
        queryClient.refetchQueries({ 
          queryKey: ['media', 'presigned-urls'],
          exact: false // Refetch all presigned URL queries
        });
      }, 2000);
      
      if (onLocationsUpdate) onLocationsUpdate();
    } catch (error: any) {
      console.error('[LocationBank] Failed to update location:', error);
      toast.error(`Failed to update location: ${error.message}`);
    }
  }

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <Loader2 className="w-8 h-8 animate-spin text-[#DC143C]" />
      </div>
    );
  }

  const selectedLocation = locations.find(l => l.locationId === selectedLocationId);

  return (
    <div className={`h-full flex flex-col bg-[#0A0A0A] ${className}`}>
      {/* Empty State */}
      {locations.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-5 mx-4 text-center">
          <MapPin className="w-12 h-12 text-[#808080] mb-3" />
          <p className="text-sm font-medium text-[#B3B3B3] mb-1">No locations yet</p>
          <p className="text-xs text-[#808080] mb-4">
            Locations can only be added in the Create section. Use this panel to view and edit existing locations.
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 mx-4">
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2.5">
              {locations.map((location) => {
                const allReferences: CinemaCardImage[] = [];
                const addedS3Keys = new Set<string>(); // Track to avoid duplicates
                
                // 🔥 MATCH CharacterBankPanel: Check location.images FIRST (primary source)
                // This is the unified images array stored in the entity (DynamoDB)
                if (location.images && Array.isArray(location.images) && location.images.length > 0) {
                  location.images.forEach((img: any) => {
                    const imageUrl = img.imageUrl || img.url;
                    const s3Key = img.s3Key || img.id;
                    if (imageUrl && s3Key) {
                      addedS3Keys.add(s3Key);
                      allReferences.push({
                        id: s3Key,
                        imageUrl: imageUrl,
                        label: img.metadata?.isBase 
                          ? `${location.name} - Base Reference`
                          : `${location.name} - ${img.label || 'Image'}`
                      });
                    }
                  });
                } else if (location.baseReference && location.baseReference.imageUrl) {
                  // Legacy fallback for single baseReference
                  if (location.baseReference.s3Key) addedS3Keys.add(location.baseReference.s3Key);
                  allReferences.push({
                    id: location.baseReference.id || location.baseReference.s3Key,
                    imageUrl: location.baseReference.imageUrl,
                    label: `${location.name} - Base Reference`
                  });
                }
                
                // 🔥 Feature 0200: Add Production Hub images from Media Library (angles, backgrounds)
                // Only add images not already added from entity.images
                const mediaLibraryImages = locationImagesFromMediaLibrary[location.locationId];
                
                if (mediaLibraryImages) {
                  // Add angle variations with valid presigned URLs
                  mediaLibraryImages.angles.forEach((angle) => {
                    if (addedS3Keys.has(angle.s3Key)) return;
                    const imageUrl = getLocationImageDisplayUrl(angle.s3Key);
                    if (imageUrl) {
                      addedS3Keys.add(angle.s3Key);
                      allReferences.push({
                        id: angle.s3Key,
                        imageUrl,
                        label: `${location.name} - ${angle.angle || angle.label || 'angle'} view`
                      });
                    }
                  });
                  
                  mediaLibraryImages.backgrounds.forEach((bg) => {
                    if (addedS3Keys.has(bg.s3Key)) return;
                    const imageUrl = getLocationImageDisplayUrl(bg.s3Key);
                    if (imageUrl) {
                      addedS3Keys.add(bg.s3Key);
                      allReferences.push({
                        id: bg.s3Key,
                        imageUrl,
                        label: `${location.name} - ${bg.backgroundType || 'Background'}`
                      });
                    }
                  });
                }
                
                // Legacy fallback: angle variations from entity
                (location.angleVariations || [])
                  .filter((variation: any) => variation.imageUrl && !addedS3Keys.has(variation.s3Key || variation.id))
                  .forEach((variation) => {
                    allReferences.push({
                      id: variation.id || variation.s3Key,
                      imageUrl: variation.imageUrl,
                      label: `${location.name} - ${variation.angle} view`
                    });
                  });

                const locationType = location.type;
                const typeLabel = location.type === 'interior' ? 'INT.' : 
                                 location.type === 'exterior' ? 'EXT.' : 'INT./EXT.';

                // Build metadata string with angles and backgrounds count
                // 🔥 Feature 0200: Use Media Library counts (source of truth) - matches detail modal
                const angleCount = mediaLibraryImages 
                  ? mediaLibraryImages.angles.filter(a => !!getLocationImageDisplayUrl(a.s3Key)).length
                  : (location.angleVariations || []).filter((v: any) => v.imageUrl).length;
                const backgroundCount = backgroundsCountByLocation[location.locationId] || 0;
                
                let metadata: string | undefined;
                if (angleCount > 0 && backgroundCount > 0) {
                  metadata = `${angleCount} angle${angleCount !== 1 ? 's' : ''}, ${backgroundCount} background${backgroundCount !== 1 ? 's' : ''}`;
                } else if (angleCount > 0) {
                  metadata = `${angleCount} angle${angleCount !== 1 ? 's' : ''}`;
                } else if (backgroundCount > 0) {
                  metadata = `${backgroundCount} background${backgroundCount !== 1 ? 's' : ''}`;
                }

                return (
                  <CinemaCard
                    key={location.locationId}
                    id={location.locationId}
                    name={location.name}
                    type={locationType}
                    typeLabel={typeLabel}
                    mainImage={allReferences.length > 0 ? allReferences[0] : null}
                    referenceImages={allReferences.slice(1)}
                    referenceCount={allReferences.length}
                    metadata={metadata}
                    description={location.description && location.description !== 'Imported from script' ? location.description : undefined}
                    cardType="location"
                    onClick={() => {
                      setSelectedLocationId(location.locationId);
                      setShowLocationDetail(true);
                    }}
                    isSelected={selectedLocationId === location.locationId}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}
      
      {/* Location Detail Modal */}
      {showLocationDetail && selectedLocation && (
        <LocationDetailModal
          location={selectedLocation}
          isOpen={showLocationDetail}
          onClose={() => {
            setShowLocationDetail(false);
            setSelectedLocationId(null);
          }}
          onUpdate={updateLocation}
          onUploadImage={async (locationId, file) => {
            toast.info('Location image upload coming soon');
          }}
          onGenerateAngles={async (locationId) => {
            handleGenerateAngles(locationId);
          }}
        />
      )}
      
      {/* Location Angle Generation Modal */}
      {showAngleModal && angleLocation && (
        <LocationAngleGenerationModal
          isOpen={showAngleModal}
          onClose={() => {
            setShowAngleModal(false);
            setAngleLocation(null);
          }}
          locationId={angleLocation.locationId}
          locationName={angleLocation.name}
          projectId={screenplayId}
          locationProfile={angleLocation}
          onComplete={async () => {
            // Job started - refresh locations after delay - Production Hub context only
            setTimeout(() => {
              queryClient.invalidateQueries({ queryKey: ['locations', screenplayId, 'production-hub'] });
              if (onLocationsUpdate) onLocationsUpdate();
            }, 5000);
          }}
        />
      )}
    </div>
  );
}

