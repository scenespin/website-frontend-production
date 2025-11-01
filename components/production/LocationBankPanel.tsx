'use client';

/**
 * Location Bank Panel - Feature 0098 Phase 3
 * 
 * Manages location references for consistent location rendering
 * Similar to Character Bank but for locations/settings
 */

import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Upload, Wand2, Loader2, Image, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

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
  
  const [locations, setLocations] = useState<LocationProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
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
  
  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }
  
  return (
    <div className={`h-full flex flex-col bg-[#141414] ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-semibold text-white">Location Bank</h2>
          </div>
          <span className="text-sm text-gray-400">{locations.length} locations</span>
        </div>
        <p className="text-xs text-gray-500">
          Upload or generate location references for consistent scenes
        </p>
      </div>
      
      {/* Action Buttons */}
      <div className="p-4 border-b border-white/10 space-y-2">
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full btn btn-primary btn-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Location
        </button>
      </div>
      
      {/* Locations List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {locations.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-2">No locations yet</p>
            <p className="text-sm text-gray-500">
              Add locations to maintain consistency across scenes
            </p>
          </div>
        ) : (
          locations.map((location) => (
            <div
              key={location.location_id}
              className="bg-[#1A1A1A] rounded-lg border border-white/10 overflow-hidden hover:border-purple-500/30 transition-all"
            >
              {/* Location Header */}
              <button
                onClick={() => setExpandedLocationId(
                  expandedLocationId === location.location_id ? null : location.location_id
                )}
                className="w-full p-4 flex items-start justify-between hover:bg-white/5 transition-colors"
              >
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-semibold">{location.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">
                      {location.type}
                    </span>
                  </div>
                  {location.description && (
                    <p className="text-sm text-gray-400 line-clamp-2">
                      {location.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Image className="w-3 h-3" />
                      {location.reference_images?.length || 0} references
                    </span>
                    {location.scenes && location.scenes.length > 0 && (
                      <span>{location.scenes.length} scenes</span>
                    )}
                  </div>
                </div>
                {expandedLocationId === location.location_id ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>
              
              {/* Expanded Content */}
              {expandedLocationId === location.location_id && (
                <div className="p-4 pt-0 border-t border-white/5">
                  {/* Reference Images Grid */}
                  {location.reference_images && location.reference_images.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                      {location.reference_images.map((img, idx) => (
                        <div key={idx} className="aspect-video rounded overflow-hidden bg-[#0A0A0A]">
                          <img
                            src={img}
                            alt={`${location.name} reference ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500 text-sm">
                      No reference images yet
                    </div>
                  )}
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button className="flex-1 btn btn-sm btn-outline">
                      <Upload className="w-4 h-4 mr-1" />
                      Upload Photo
                    </button>
                    <button className="flex-1 btn btn-sm btn-outline">
                      <Wand2 className="w-4 h-4 mr-1" />
                      Generate Angles
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
      
      {/* Create Location Modal (placeholder) */}
      {showCreateModal && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="bg-[#1A1A1A] rounded-xl p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-white mb-4">Add Location</h3>
            <p className="text-gray-400 mb-4">
              Upload a photo or generate a location from a description
            </p>
            <div className="space-y-2">
              <button className="w-full btn btn-primary">
                <Upload className="w-4 h-4 mr-2" />
                Upload Location Photo
              </button>
              <button className="w-full btn btn-outline">
                <Wand2 className="w-4 h-4 mr-2" />
                Generate with AI
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-full btn btn-ghost"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

