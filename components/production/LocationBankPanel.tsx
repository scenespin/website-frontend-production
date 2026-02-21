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
  const screenplayId = (screenplay.screenplayId || '').trim() || '';
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  // React Query for fetching locations - Production Hub context
  const { data: locations = propsLocations, isLoading: queryLoading } = useLocations(
    screenplayId || '',
    'production-hub', // 🔥 FIX: Use production-hub context to separate from Creation section
    !!screenplayId
  );

  // Feature 0256: Payload-first. Query Media Library only for URL enrichment (presigned, Dropbox).
  const { data: allLocationMediaFiles = [] } = useMediaFiles(
    screenplayId || '',
    undefined,
    !!screenplayId,
    true,
    'location'
  );

  // Feature 0256: Build list of s3Keys from location payload (source of truth for what to show).
  const allLocationS3Keys = useMemo(() => {
    const keys: string[] = [];
    locations.forEach((loc) => {
      if (loc.baseReference?.s3Key && !loc.baseReference.s3Key.startsWith('thumbnails/')) keys.push(loc.baseReference.s3Key);
      (loc.angleVariations || []).forEach((v: any) => { if (v.s3Key && !v.s3Key.startsWith('thumbnails/')) keys.push(v.s3Key); });
      (loc.backgrounds || []).forEach((b: any) => { if (b.s3Key && !b.s3Key.startsWith('thumbnails/')) keys.push(b.s3Key); });
      (loc.images || []).forEach((img: any) => {
        const s3 = img.s3Key || img.metadata?.s3Key;
        if (s3 && !s3.startsWith('thumbnails/')) keys.push(s3);
      });
    });
    return [...new Set(keys)];
  }, [locations]);

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
    if (!file) return null;
    return getMediaFileDisplayUrl(
      file,
      presignedMapsForDisplay,
      dropboxUrlMap
    );
  }, [locationMediaFileMap, presignedMapsForDisplay, dropboxUrlMap]);

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
      if (updates.backgrounds !== undefined) {
        apiUpdates.backgrounds = updates.backgrounds;
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
      
      // Same pattern as angle delete: invalidate + delayed refetch (angles, backgrounds, ECU all use this path)
      queryClient.removeQueries({ queryKey: ['locations', screenplayId, 'production-hub'] });
      queryClient.invalidateQueries({ queryKey: ['locations', screenplayId, 'production-hub'] });
      queryClient.invalidateQueries({ queryKey: ['media', 'files', screenplayId], exact: false });
      queryClient.invalidateQueries({ queryKey: ['media', 'presigned-urls'], exact: false });
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['locations', screenplayId, 'production-hub'], type: 'active' });
        queryClient.refetchQueries({ queryKey: ['media', 'files', screenplayId], exact: false });
        queryClient.refetchQueries({ queryKey: ['media', 'presigned-urls'], exact: false });
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
                // Feature 0256: Build card list from payload first; ML only for display URL.
                const allReferences: CinemaCardImage[] = [];
                const addedS3Keys = new Set<string>();

                const urlFor = (s3Key: string, payloadUrl?: string) => {
                  // Prefer stable proxy/display URL; payload imageUrl may be an expired presigned URL.
                  return getLocationImageDisplayUrl(s3Key) || payloadUrl;
                };

                // 1) Creation: baseReference then creation images from location.images
                if (location.baseReference?.s3Key && !addedS3Keys.has(location.baseReference.s3Key)) {
                  const imageUrl = urlFor(location.baseReference.s3Key, location.baseReference.imageUrl);
                  if (imageUrl) {
                    addedS3Keys.add(location.baseReference.s3Key);
                    allReferences.push({
                      id: location.baseReference.id || location.baseReference.s3Key,
                      imageUrl,
                      label: `${location.name} - Base Reference`
                    });
                  }
                }
                (location.images || [])
                  .filter((img: any) => {
                    const s3 = img.s3Key || img.metadata?.s3Key;
                    return s3 && (img.metadata?.isBase === true || img.metadata?.createdIn === 'creation') && !addedS3Keys.has(s3);
                  })
                  .forEach((img: any) => {
                    const s3Key = img.s3Key || img.metadata?.s3Key;
                    const imageUrl = urlFor(s3Key, img.imageUrl || img.url);
                    if (imageUrl) {
                      addedS3Keys.add(s3Key);
                      allReferences.push({
                        id: s3Key,
                        imageUrl,
                        label: img.metadata?.isBase ? `${location.name} - Base Reference` : `${location.name} - ${img.metadata?.label || 'Image'}`
                      });
                    }
                  });
                // 2) Angles from payload
                (location.angleVariations || []).forEach((v: any) => {
                  const s3Key = v.s3Key || v.id;
                  if (!s3Key || addedS3Keys.has(s3Key)) return;
                  const imageUrl = urlFor(s3Key, v.imageUrl);
                  if (imageUrl) {
                    addedS3Keys.add(s3Key);
                    allReferences.push({
                      id: v.id || s3Key,
                      imageUrl,
                      label: `${location.name} - ${v.angle || 'angle'} view`
                    });
                  }
                });
                // 3) Backgrounds from payload
                (location.backgrounds || []).forEach((b: any) => {
                  if (!b.s3Key || addedS3Keys.has(b.s3Key)) return;
                  const imageUrl = urlFor(b.s3Key, b.imageUrl);
                  if (imageUrl) {
                    addedS3Keys.add(b.s3Key);
                    allReferences.push({
                      id: b.id || b.s3Key,
                      imageUrl,
                      label: `${location.name} - ${b.backgroundType || 'Background'}`
                    });
                  }
                });

                const locationType = location.type;
                const typeLabel = location.type === 'interior' ? 'INT.' : 
                                 location.type === 'exterior' ? 'EXT.' : 'INT./EXT.';

                // Feature 0256: Counts from payload
                const angleCount = location.angleVariations?.length ?? 0;
                const backgroundCount = location.backgrounds?.length ?? 0;
                
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

