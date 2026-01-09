'use client';

/**
 * Location Bank Panel - Simplified React Query Version
 * 
 * Production Hub Simplification Plan - Phase 1
 * Reduced from ~358 lines to ~200 lines using React Query
 */

import React, { useState, useEffect, useMemo } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@clerk/nextjs';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { useQueryClient } from '@tanstack/react-query';
import { CinemaCard, type CinemaCardImage } from './CinemaCard';
import { LocationDetailModal } from './LocationDetailModal';
import LocationAngleGenerationModal from './LocationAngleGenerationModal';
import { useLocations, type LocationProfile } from '@/hooks/useLocationBank';
import { useMediaFiles } from '@/hooks/useMediaLibrary';
import { isBackgroundFile } from './utils/mediaLibraryMappers';

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
  const screenplayId = screenplay.screenplayId; // 🔥 MATCH MODALS: Use context directly (same as LocationDetailModal)
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  // 🔥 MATCH MODALS: Use React Query hook directly (same pattern as LocationDetailModal)
  const { data: locations = propsLocations, isLoading: queryLoading } = useLocations(
    screenplayId || '',
    'production-hub',
    !!screenplayId
  );

  // 🔥 FIX: Fetch all location media files to count backgrounds from Media Library (source of truth)
  const { data: allLocationMediaFiles = [] } = useMediaFiles(
    screenplayId || '',
    undefined,
    !!screenplayId,
    true, // includeAllFolders
    'location' // entityType
  );

  // 🔥 FIX: Count backgrounds per location from Media Library (not stale location.backgrounds)
  const backgroundCountsByLocationId = useMemo(() => {
    const counts = new Map<string, number>();
    
    allLocationMediaFiles.forEach((file: any) => {
      const locationId = file.metadata?.entityId || file.entityId;
      if (!locationId) return;
      
      // Skip thumbnails
      if (file.s3Key?.startsWith('thumbnails/')) return;
      if (!file.s3Key) return;
      
      // Use same utility function as useLocationReferences to identify backgrounds
      const isBackground = isBackgroundFile(file) ||
                           file.metadata?.source === 'background-generation' ||
                           file.metadata?.uploadMethod === 'background-generation' ||
                           file.metadata?.generationMethod === 'background-generation';
      
      if (isBackground) {
        counts.set(locationId, (counts.get(locationId) || 0) + 1);
      }
    });
    
    return counts;
  }, [allLocationMediaFiles]);

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
      
      // Invalidate React Query cache - Production Hub context only
      console.log('[LocationBankPanel] 🔄 Invalidating locations cache');
      queryClient.invalidateQueries({ queryKey: ['locations', screenplayId, 'production-hub'] });
      queryClient.invalidateQueries({ queryKey: ['media', 'files', screenplayId] });
      
      // 🔥 FIX: Await refetch like CharacterBankPanel does to ensure immediate UI update
      console.log('[LocationBankPanel] 🔄 Refetching locations after update');
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['locations', screenplayId, 'production-hub'] }),
        queryClient.refetchQueries({ queryKey: ['media', 'files', screenplayId] })
      ]);
      
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
                
                // 🔥 NEW: Check unified images array first (like AssetBankPanel and CharacterBankPanel)
                // This is the primary source of truth for all location images
                if (location.images && Array.isArray(location.images) && location.images.length > 0) {
                  location.images.forEach((img: any) => {
                    // Use imageUrl (locations use imageUrl, not url like assets)
                    const imageUrl = img.imageUrl || img.url;
                    if (imageUrl) {
                      allReferences.push({
                        id: img.s3Key || img.metadata?.s3Key || `img-${location.locationId}-${allReferences.length}`,
                        imageUrl: imageUrl,
                        label: img.metadata?.isBase
                          ? `${location.name} - Base Reference`
                          : img.metadata?.isBackground
                          ? `${location.name} - ${img.metadata.backgroundType || 'Background'}`
                          : `${location.name} - ${img.metadata?.angle || 'Angle'} view`
                      });
                    }
                  });
                } else {
                  // Fallback to separate fields for backward compatibility
                  // Add base reference (only if it has imageUrl)
                  if (location.baseReference?.imageUrl) {
                    allReferences.push({
                      id: location.baseReference.id,
                      imageUrl: location.baseReference.imageUrl,
                      label: `${location.name} - Base Reference`
                    });
                  }
                  
                  // Add angle variations (only if they have imageUrl)
                  (location.angleVariations || []).forEach((variation) => {
                    if (variation?.imageUrl) {
                      allReferences.push({
                        id: variation.id,
                        imageUrl: variation.imageUrl,
                        label: `${location.name} - ${variation.angle} view`
                      });
                    }
                  });
                }

                const locationType = location.type;
                const typeLabel = location.type === 'interior' ? 'INT.' : 
                                 location.type === 'exterior' ? 'EXT.' : 'INT./EXT.';

                // 🔥 FIX: Build metadata string with angles and backgrounds count
                // Count from unified images array if available, otherwise use separate fields
                let angleCount = 0;
                let backgroundCount = 0;
                
                if (location.images && Array.isArray(location.images)) {
                  // Count from unified images array
                  location.images.forEach((img: any) => {
                    // Check for backgrounds: isBackground flag OR source is 'background-generation'
                    if (img.metadata?.isBackground || img.metadata?.source === 'background-generation') {
                      backgroundCount++;
                    } 
                    // Check for angles: isAngle flag OR source is 'angle-generation' (but NOT backgrounds)
                    else if (img.metadata?.isAngle || img.metadata?.source === 'angle-generation') {
                      angleCount++;
                    }
                    // Base references and creation images don't count as angles or backgrounds
                  });
                } else {
                  // Fallback: Use separate fields and Media Library count
                  angleCount = location.angleVariations?.length || 0;
                  backgroundCount = backgroundCountsByLocationId.get(location.locationId) || 0;
                }
                
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

