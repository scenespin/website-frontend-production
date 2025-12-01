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
  const [isGeneratingAngles, setIsGeneratingAngles] = useState<Record<string, boolean>>({});
  
  // Use locations from props (loaded by ProductionPageLayout from Location Bank API)
  useEffect(() => {
    setLocations(propsLocations);
    setIsLoading(propsIsLoading);
    console.log('[LocationBankPanel] Locations updated:', propsLocations.length);
  }, [propsLocations, propsIsLoading]);

  // Generate angle variations (Feature 0142: Location Bank Unification)
  async function generateAngles(locationId: string) {
    console.log('[LocationBank] Generate angles clicked for location:', locationId);
    setIsGeneratingAngles(prev => ({ ...prev, [locationId]: true }));
    try {
      const location = locations.find(l => l.locationId === locationId);
      if (!location) {
        throw new Error('Location not found');
      }

      // Call Next.js API route which will proxy to backend with auth
      const response = await fetch('/api/location-bank/generate-angles', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          locationProfile: location,
          angles: [
            { angle: 'side' },
            { angle: 'aerial' },
            { angle: 'wide' },
            { angle: 'detail' }
          ]
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || errorData.message || 'Failed to generate angles');
      }

      const data = await response.json();
      console.log('[LocationBank] Generate angles success:', data);
      
      if (data.success) {
        toast.success(`Generated ${data.data?.angleVariations?.length || 0} angle variations!`);
        if (onLocationsUpdate) {
          onLocationsUpdate();
        }
      } else {
        throw new Error(data.error || 'Generation failed');
      }
    } catch (error: any) {
      console.error('[LocationBank] Generate angles failed:', error);
      toast.error(error.message || 'Failed to generate angle variations');
    } finally {
      setIsGeneratingAngles(prev => ({ ...prev, [locationId]: false }));
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
                await updateLocation(locationId, updates);
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
              // Feature 0142: Generate angle variations via Location Bank API
              await generateAngles(locationId);
            }}
          />
        ) : null;
      })()}
      
    </div>
  );
}

