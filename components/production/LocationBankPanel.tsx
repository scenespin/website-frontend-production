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
  projectId: string;
  className?: string;
  locations?: LocationProfile[]; // Locations from Location Bank API
  isLoading?: boolean; // Loading state
  onLocationsUpdate?: () => void; // Callback to refresh locations
}

export function LocationBankPanel({
  projectId,
  className = '',
  locations: propsLocations = [],
  isLoading: propsIsLoading = false,
  onLocationsUpdate
}: LocationBankPanelProps) {
  const { updateLocation } = useScreenplay();
  const [locations, setLocations] = useState<LocationProfile[]>(propsLocations);
  const [isLoading, setIsLoading] = useState(propsIsLoading);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [showLocationDetail, setShowLocationDetail] = useState(false);
  const [showAngleModal, setShowAngleModal] = useState(false);
  const [angleLocation, setAngleLocation] = useState<LocationProfile | null>(null);
  
  // Use locations from props (loaded by ProductionPageLayout from Location Bank API)
  useEffect(() => {
    setLocations(propsLocations);
    setIsLoading(propsIsLoading);
    console.log('[LocationBankPanel] Locations updated:', propsLocations.length);
  }, [propsLocations, propsIsLoading]);

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
              // Handle location updates via ScreenplayContext
              try {
                // Map LocationProfile type to LocationType
                const locationUpdates: any = { ...updates };
                if (updates.type) {
                  // Convert 'interior' | 'exterior' | 'mixed' to 'INT' | 'EXT' | 'INT/EXT'
                  const typeMap: Record<string, 'INT' | 'EXT' | 'INT/EXT'> = {
                    'interior': 'INT',
                    'exterior': 'EXT',
                    'mixed': 'INT/EXT'
                  };
                  locationUpdates.type = typeMap[updates.type] || updates.type;
                }
                await updateLocation(locationId, locationUpdates);
                if (onLocationsUpdate) {
                  onLocationsUpdate();
                }
              } catch (error) {
                console.error('[LocationBank] Failed to update location:', error);
                toast.error('Failed to update location');
              }
            }}
            projectId={projectId}
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
          projectId={projectId}
          locationProfile={angleLocation}
          onComplete={async (result) => {
            // Job is created - generation happens asynchronously
            // Angles will appear in Location Bank once job completes
            toast.success(`Angle generation started for ${angleLocation.name}!`, {
              description: 'Check the Jobs tab to track progress.'
            });
            
            setShowAngleModal(false);
            setAngleLocation(null);
            
            // Refresh location data after delay to catch completed angles
            setTimeout(() => {
              if (onLocationsUpdate) {
                onLocationsUpdate();
              }
            }, 5000);
          }}
        />
      )}
    </div>
  );
}

