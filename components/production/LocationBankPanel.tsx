'use client';

/**
 * Location Bank Panel - Feature 0098 Phase 3
 * 
 * Manages location references for consistent location rendering
 * REDESIGNED to match CharacterBankPanel exactly for UI consistency
 */

import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Upload, Wand2, Loader2, Image, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { useChatContext } from '@/contexts/ChatContext';
import { useDrawer } from '@/contexts/DrawerContext';
import LocationDetailSidebar from '../screenplay/LocationDetailSidebar';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from '@clerk/nextjs';
import { CinemaCard, type CinemaCardImage } from './CinemaCard';
import { LocationDetailModal } from './LocationDetailModal';

interface LocationProfile {
  location_id: string;
  project_id: string;
  name: string;
  full_name?: string;
  type: 'INT.' | 'EXT.' | 'INT./EXT.';
  description: string;
  scenes?: string[];
  reference_images: string[];
  created_at: string;
  updated_at: string;
}

interface LocationBankPanelProps {
  projectId: string;
  className?: string;
}

export function LocationBankPanel({
  projectId,
  className = ''
}: LocationBankPanelProps) {
  const { getToken } = useAuth();
  
  const { createLocation, updateLocation, deleteLocation } = useScreenplay();
  const { setWorkflow } = useChatContext();
  const { setIsDrawerOpen } = useDrawer();
  
  const [locations, setLocations] = useState<LocationProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateSidebar, setShowCreateSidebar] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [showLocationDetail, setShowLocationDetail] = useState(false);
  
  // Load locations
  useEffect(() => {
    loadLocations();
  }, [projectId]);
  
  async function loadLocations() {
    try {
      setIsLoading(true);
      
      const token = await getToken({ template: 'wryda-backend' });
      const response = await fetch(`/api/projects/${projectId}/locations`, { // projectId is treated as screenplayId by backend
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to load locations');
      
      const data = await response.json();
      const locationsData = data.locations || data || [];
      // Ensure reference_images is properly mapped from referenceImages
      const mappedLocations = locationsData.map((loc: any) => ({
        ...loc,
        reference_images: loc.reference_images || loc.referenceImages || []
      }));
      setLocations(mappedLocations);
      
    } catch (error: any) {
      console.error('[LocationBank] Error loading locations:', error);
      toast.error('Failed to load locations');
    } finally {
      setIsLoading(false);
    }
  }
  
  // Location creation handlers
  const handleCreateLocation = async (locationData: any) => {
    try {
      await createLocation(locationData);
      toast.success('Location created!');
      setShowCreateSidebar(false);
      await loadLocations(); // Reload to get the new location
    } catch (error) {
      console.error('[LocationBank] Create failed:', error);
      toast.error('Failed to create location');
    }
  };

  const handleSwitchToChatForInterview = (location: any, context: any) => {
    // Start the AI interview workflow
    setWorkflow(context);
    setIsDrawerOpen(true);
    setShowCreateSidebar(false);
  };
  
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
          <button
            onClick={() => setShowCreateSidebar(true)}
            className="p-1.5 hover:bg-[#DC143C]/10 rounded-lg transition-colors"
            title="Add Location"
          >
            <Plus className="w-5 h-5 text-[#DC143C]" />
          </button>
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
            Add locations to maintain consistency across scenes
          </p>
          <button
            onClick={() => setShowCreateSidebar(true)}
            className="px-4 py-2 bg-[#DC143C] hover:bg-[#B91238] text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Location
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {/* Location Cards Grid - Smaller cards with more spacing */}
          <div className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
              {locations.map((location) => {
                // Convert reference_images to CinemaCardImage format
                const referenceImages: CinemaCardImage[] = (location.reference_images || []).map((img, idx) => ({
                  id: `ref-${idx}`,
                  imageUrl: img,
                  label: `${location.name} - Reference ${idx + 1}`
                }));

                // Determine location type for badge
                const locationType = location.type === 'INT.' ? 'interior' : 
                                    location.type === 'EXT.' ? 'exterior' : 'mixed';

                return (
                  <CinemaCard
                    key={location.location_id}
                    id={location.location_id}
                    name={location.name}
                    type={locationType}
                    typeLabel={location.type}
                    mainImage={referenceImages.length > 0 ? referenceImages[0] : null}
                    referenceImages={referenceImages.slice(1)}
                    referenceCount={referenceImages.length}
                    metadata={location.scenes && location.scenes.length > 0 ? `${location.scenes.length} scenes` : undefined}
                    description={location.description}
                    cardType="location"
                    onClick={() => {
                      setSelectedLocationId(location.location_id);
                      setShowLocationDetail(true);
                    }}
                    isSelected={selectedLocationId === location.location_id}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}
      
      {/* Location Detail Modal */}
      {showLocationDetail && selectedLocationId && (() => {
        const selectedLocation = locations.find(l => l.location_id === selectedLocationId);
        return selectedLocation ? (
          <LocationDetailModal
            location={selectedLocation}
            isOpen={showLocationDetail}
            onClose={() => {
              setShowLocationDetail(false);
              setSelectedLocationId(null);
            }}
            onUpdate={async (locationId, updates) => {
              // Handle location updates
              console.log('Update location:', locationId, updates);
              await loadLocations();
            }}
            projectId={projectId}
            onUploadImage={async (locationId, file) => {
              // TODO: Implement location image upload
              toast.info('Location image upload coming soon');
            }}
            onGenerate3D={async (locationId) => {
              // TODO: Implement 3D generation
              toast.info('3D generation coming soon');
            }}
            onGenerateAngles={async (locationId) => {
              // TODO: Implement angle package generation
              toast.info('Angle package generation coming soon');
            }}
          />
        ) : null;
      })()}
      
      {/* Create Location Sidebar */}
      <AnimatePresence>
        {showCreateSidebar && (
          <LocationDetailSidebar
            location={null}
            isCreating={true}
            initialData={null}
            onClose={() => setShowCreateSidebar(false)}
            onCreate={handleCreateLocation}
            onUpdate={() => {}} // Not used in creation mode
            onDelete={() => {}} // Not used in creation mode
            onSwitchToChatImageMode={handleSwitchToChatForInterview}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
