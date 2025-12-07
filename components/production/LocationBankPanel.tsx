'use client';

/**
 * Location Bank Panel - Feature 0098 Phase 3
 * 
 * Manages location references for consistent location rendering
 * REDESIGNED to match CharacterBankPanel exactly for UI consistency
 */

import React, { useState, useEffect } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@clerk/nextjs';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { CinemaCard, type CinemaCardImage } from './CinemaCard';
import { LocationDetailModal } from './LocationDetailModal';
import LocationAngleGenerationModal from './LocationAngleGenerationModal';

// Location Profile from Location Bank API (Feature 0142: Unified storage)
interface LocationReference {
  id: string;
  locationId: string;
  imageUrl: string;
  s3Key: string;
  angle: 'front' | 'side' | 'aerial' | 'interior' | 'exterior' | 'wide' | 'detail';
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  weather?: 'sunny' | 'cloudy' | 'rainy' | 'snowy';
  generationMethod: 'upload' | 'ai-generated' | 'angle-variation';
  creditsUsed: number;
  createdAt: string;
}

interface LocationProfile {
  locationId: string;
  screenplayId: string;
  projectId: string; // Backward compatibility
  name: string;
  type: 'interior' | 'exterior' | 'mixed';
  description: string;
  baseReference: LocationReference;
  angleVariations: LocationReference[];
  totalCreditsSpent?: number;
  consistencyRating?: number;
  createdAt: string;
  updatedAt: string;
}

interface LocationBankPanelProps {
  // Removed projectId prop - screenplayId comes from ScreenplayContext
  className?: string;
  locations?: LocationProfile[]; // Locations from Location Bank API
  isLoading?: boolean; // Loading state
  onLocationsUpdate?: () => void; // Callback to refresh locations
}

export function LocationBankPanel({
  className = '',
  locations: propsLocations = [],
  isLoading: propsIsLoading = false,
  onLocationsUpdate
}: LocationBankPanelProps) {
  // 🔥 FIX: Get screenplayId from context instead of props
  const screenplay = useScreenplay();
  const screenplayId = screenplay.screenplayId;
  
  const { getToken } = useAuth();
  const [locations, setLocations] = useState<LocationProfile[]>(propsLocations);
  const [isLoading, setIsLoading] = useState(propsIsLoading);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [showLocationDetail, setShowLocationDetail] = useState(false);
  const [showAngleModal, setShowAngleModal] = useState(false);
  const [angleLocation, setAngleLocation] = useState<LocationProfile | null>(null);
  
  // 🔥 SIMPLIFIED: Fetch locations directly from Location Bank API (like AssetBankPanel)
  // ✅ FIX: All hooks must be called BEFORE early return
  useEffect(() => {
    if (screenplayId) {
      fetchLocations();
    }
  }, [screenplayId]);
  
  // 🔥 NEW: Listen for location refresh events (e.g., when angle generation completes)
  useEffect(() => {
    if (!screenplayId) return;
    
    const handleRefreshLocations = async () => {
      console.log('[LocationBankPanel] Refreshing locations due to refreshLocations event');
      await fetchLocations();
      // If a location detail modal is open, refresh the selected location
      if (selectedLocationId) {
        await fetchLocations();
      }
    };
    
    window.addEventListener('refreshLocations', handleRefreshLocations);
    return () => {
      window.removeEventListener('refreshLocations', handleRefreshLocations);
    };
  }, [screenplayId, selectedLocationId]);
  
  // 🔥 CRITICAL: Early return AFTER all hooks are called
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
  
  const fetchLocations = async () => {
    setIsLoading(true);
    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) {
        console.log('[LocationBankPanel] No auth token available');
        setIsLoading(false);
        return;
      }
      
      // 🔥 SIMPLIFIED: Fetch from Location Bank API directly (backend already provides angleVariations)
      const response = await fetch(`/api/location-bank/list?screenplayId=${encodeURIComponent(screenplayId)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch locations');
      }
      
      const data = await response.json();
      const locationsList = data.locations || data.data?.locations || [];
      
      setLocations(locationsList);
      
      // 🔥 FIX: If selectedLocation is open, the modal will automatically re-render with fresh data
      // because it uses locations.find() which will get the updated location from locationsList
      // No need to explicitly update - React will handle the re-render when locations state changes
      
      console.log('[LocationBankPanel] ✅ Fetched locations from Location Bank API:', locationsList.length, 'locations');
    } catch (error) {
      console.error('[LocationBankPanel] Failed to fetch locations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Open angle generation modal
  function handleGenerateAngles(locationId: string) {
    const location = locations.find(l => l.locationId === locationId);
    if (location) {
      setAngleLocation(location);
      setShowAngleModal(true);
    }
  }
  
  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <Loader2 className="w-8 h-8 animate-spin text-[#DC143C]" />
      </div>
    );
  }
  
  return (
    <div className={`h-full flex flex-col bg-[#0A0A0A] ${className}`}>
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-[#3F3F46]">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-semibold text-[#FFFFFF]">
            Location Bank
          </h2>
        </div>
        <p className="text-xs text-[#808080]">
          {locations.length} location{locations.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Empty State */}
      {locations.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <MapPin className="w-12 h-12 text-[#808080] mb-3" />
          <p className="text-sm font-medium text-[#B3B3B3] mb-1">
            No locations yet
          </p>
          <p className="text-xs text-[#808080] mb-4">
            Locations can only be added in the Create section. Use this panel to view and edit existing locations.
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {/* Location Cards Grid - Smaller cards with more spacing */}
          <div className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
              {locations.map((location) => {
                // Convert baseReference and angleVariations to CinemaCardImage format
                const allReferences: CinemaCardImage[] = [];
                
                if (location.baseReference) {
                  allReferences.push({
                    id: location.baseReference.id,
                    imageUrl: location.baseReference.imageUrl,
                    label: `${location.name} - Base Reference`
                  });
                }
                
                location.angleVariations.forEach((variation) => {
                  allReferences.push({
                    id: variation.id,
                    imageUrl: variation.imageUrl,
                    label: `${location.name} - ${variation.angle} view`
                  });
                });

                // Determine location type for badge
                const locationType = location.type;
                const typeLabel = location.type === 'interior' ? 'INT.' : 
                                 location.type === 'exterior' ? 'EXT.' : 'INT./EXT.';

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
                    metadata={location.angleVariations.length > 0 ? `${location.angleVariations.length} angles` : undefined}
                    description={location.description}
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
      {showLocationDetail && selectedLocationId && (() => {
        const selectedLocation = locations.find(l => l.locationId === selectedLocationId);
        return selectedLocation ? (
            <LocationDetailModal
            location={selectedLocation}
            isOpen={showLocationDetail}
            onClose={() => {
              setShowLocationDetail(false);
              setSelectedLocationId(null);
            }}
            onUpdate={async (locationId, updates) => {
              // 🔥 FIX: Update LocationProfile via Location Bank API (not ScreenplayContext)
              // Production Hub changes should NOT sync back to Creation section
              try {
                const token = await getToken({ template: 'wryda-backend' });
                if (!token) {
                  throw new Error('Not authenticated');
                }
                
                // Convert LocationProfile updates to API format
                const apiUpdates: any = {};
                
                // Handle angleVariations - pass directly (Location Bank API expects LocationReference[])
                if (updates.angleVariations !== undefined) {
                  apiUpdates.angleVariations = updates.angleVariations;
                }
                
                // Handle other fields
                if (updates.name !== undefined) apiUpdates.name = updates.name;
                if (updates.description !== undefined) apiUpdates.description = updates.description;
                if (updates.type !== undefined) apiUpdates.type = updates.type;
                
                // Call Location Bank API with screenplayId in query params
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
                
                // 🔥 ONE-WAY SYNC: Do NOT update ScreenplayContext - Production Hub changes stay in Production Hub
                
                // 🔥 FIX: Refresh locations from API (same pattern as CharacterBankPanel)
                await fetchLocations();
                if (onLocationsUpdate) {
                  onLocationsUpdate();
                }
                toast.success('Location updated successfully');
              } catch (error: any) {
                console.error('[LocationBank] Failed to update location:', error);
                toast.error(`Failed to update location: ${error.message}`);
              }
            }}
            onUploadImage={async (locationId, file) => {
              // TODO: Implement location image upload via Location Bank API
              toast.info('Location image upload coming soon');
            }}
            onGenerate3D={async (locationId) => {
              // TODO: Implement 3D generation
              toast.info('3D generation coming soon');
            }}
            onGenerateAngles={async (locationId) => {
              // Open angle generation modal
              handleGenerateAngles(locationId);
            }}
          />
        ) : null;
      })()}
      
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
          onComplete={async (result) => {
            // Job started - modal already closed, job runs in background
            // User can track progress in Jobs tab
            // Location data will refresh automatically when job completes (via ProductionJobsPanel)
          }}
        />
      )}
    </div>
  );
}

