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
  
  const { createLocation, updateLocation, deleteLocation } = useScreenplay();
  const { setWorkflow } = useChatContext();
  const { setIsDrawerOpen } = useDrawer();
  
  const [locations, setLocations] = useState<LocationProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateSidebar, setShowCreateSidebar] = useState(false);
  const [expandedLocationId, setExpandedLocationId] = useState<string | null>(null);
  
  // Load locations
  useEffect(() => {
    loadLocations();
  }, [projectId]);
  
  async function loadLocations() {
    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/projects/${projectId}/locations`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to load locations');
      
      const data = await response.json();
      setLocations(data.locations || []);
      
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
    <div className={`h-full flex flex-col bg-slate-900 ${className}`}>
      {/* Header - Matches CharacterBankPanel */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-slate-700">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-semibold text-slate-200">
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
        <p className="text-xs text-slate-400">
          {locations.length} location{locations.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Empty State - EXACTLY matches CharacterBankPanel */}
      {locations.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <MapPin className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
            No locations yet
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-500 mb-4">
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
          {/* Location Cards - Matches CharacterBankPanel structure */}
          <div className="p-3 space-y-2">
            {locations.map((location) => {
              const isExpanded = expandedLocationId === location.location_id;
              
              return (
                <div key={location.location_id} className="space-y-2">
                  {/* Location Card */}
                  <button
                    onClick={() => setExpandedLocationId(isExpanded ? null : location.location_id)}
                    className="w-full bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-slate-600 rounded-lg p-3 text-left transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-slate-200 font-semibold truncate">
                            {location.name}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300 flex-shrink-0">
                            {location.type}
                          </span>
                        </div>
                        {location.description && (
                          <p className="text-xs text-slate-400 line-clamp-2 mb-2">
                            {location.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Image className="w-3 h-3" />
                            {location.reference_images?.length || 0}
                          </span>
                          {location.scenes && location.scenes.length > 0 && (
                            <span>{location.scenes.length} scenes</span>
                          )}
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0 ml-2" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0 ml-2" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 space-y-3">
                      {/* Reference Images Grid */}
                      {location.reference_images && location.reference_images.length > 0 ? (
                        <div className="grid grid-cols-3 gap-2">
                          {location.reference_images.map((img, idx) => (
                            <div key={idx} className="aspect-square rounded overflow-hidden bg-slate-700">
                              <img
                                src={img}
                                alt={`${location.name} reference ${idx + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-slate-500 text-xs">
                          No reference images yet
                        </div>
                      )}
                      
                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            toast.info('Upload functionality coming soon');
                          }}
                          className="flex-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded transition-colors flex items-center justify-center gap-1"
                        >
                          <Upload className="w-3 h-3" />
                          Upload
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            toast.info('AI generation coming soon');
                          }}
                          className="flex-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded transition-colors flex items-center justify-center gap-1"
                        >
                          <Wand2 className="w-3 h-3" />
                          Generate
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      
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
