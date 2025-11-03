'use client';

import { useUser } from '@clerk/nextjs';
import { useAuth } from '@clerk/nextjs';
import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useEditorContext } from '@/lib/contextStore';
import { locationsAPI } from '@/lib/navigationAPI';
import { MapPin, Plus, Edit, Trash2, Image, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { EditorSubNav } from '@/components/editor/EditorSubNav';

export default function LocationsPage() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');
  const locationId = searchParams.get('locationId');
  const context = useEditorContext();
  
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showAddLocation, setShowAddLocation] = useState(false);

  // Load locations from API
  useEffect(() => {
    if (!projectId || !user) return;
    
    const loadLocations = async () => {
      try {
        setLoading(true);
        const token = await getToken();
        if (!token) throw new Error('No auth token');
        
        const data = await locationsAPI.getLocations(projectId, token);
        setLocations(data);
        
        // Auto-select location from context
        if (locationId) {
          const loc = data.find(l => l.location_id === locationId);
          if (loc) setSelectedLocation(loc);
        } else if (context.currentSceneName) {
          const sceneLoc = context.currentSceneName.split(' - ')[0]?.replace(/^(INT|EXT|INT\.|EXT\.)\s+/, '').trim();
          const loc = data.find(l => l.name === sceneLoc);
          if (loc) setSelectedLocation(loc);
        }
      } catch (error) {
        console.error('Failed to load locations:', error);
        toast.error('Failed to load locations', {
          description: error.message
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadLocations();
  }, [projectId, user, locationId, context.currentSceneName, getToken]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-100">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Please sign in</h2>
          <p className="opacity-60">You need to be signed in to access Locations</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <ResponsiveHeader />
      <div className="min-h-screen bg-base-100 text-base-content pt-16">
        {/* Editor Sub-Navigation */}
        <EditorSubNav activeTab="locations" projectId={projectId} />

      {/* Header */}
      <div className="bg-gradient-to-r from-cinema-red to-cinema-blue text-base-content shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MapPin className="w-8 h-8" />
              <div>
                <h1 className="text-3xl font-extrabold">Locations</h1>
                <p className="text-sm opacity-80">Manage scene settings and environments</p>
              </div>
            </div>
            <button 
              onClick={() => setShowAddLocation(true)}
              className="btn btn-sm bg-white/20 hover:bg-white/30 gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Location
            </button>
          </div>
        </div>
      </div>

      {/* Context Indicator */}
      {context.currentSceneName && (
        <div className="bg-info/10 border-b border-info/20">
          <div className="max-w-7xl mx-auto px-4 py-2 text-sm">
            <span className="opacity-70">Current scene location:</span>{' '}
            <span className="font-semibold">{context.currentSceneName}</span>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Locations List */}
          <div className="lg:col-span-1">
            <div className="card bg-base-200 shadow-xl">
              <div className="card-body">
                <h2 className="card-title">All Locations</h2>
                <p className="text-sm opacity-60 mb-4">{locations.length} location{locations.length !== 1 ? 's' : ''}</p>
                
                <div className="space-y-2">
                  {locations.map(location => (
                    <button
                      key={location.location_id}
                      onClick={() => setSelectedLocation(location)}
                      className={`w-full text-left p-4 rounded-lg transition-colors ${
                        selectedLocation?.location_id === location.location_id
                          ? 'bg-cinema-gold/20 border-2 border-cinema-gold'
                          : 'bg-base-300 hover:bg-base-100'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${location.type === 'INT.' ? 'bg-blue-500/20' : 'bg-green-500/20'}`}>
                          <MapPin className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="badge badge-xs">{location.type}</span>
                            <span className="font-bold text-sm truncate">{location.name}</span>
                          </div>
                          <div className="text-xs opacity-60 truncate mt-1">{location.full_name}</div>
                          <div className="text-xs opacity-50 mt-1">
                            {location.scenes.length} scene{location.scenes.length !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Location Details */}
          <div className="lg:col-span-2">
            {selectedLocation ? (
              <div className="card bg-base-200 shadow-xl">
                <div className="card-body">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`p-3 rounded-lg ${selectedLocation.type === 'INT.' ? 'bg-blue-500/20' : 'bg-green-500/20'}`}>
                        <MapPin className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="card-title text-2xl">{selectedLocation.full_name}</h2>
                        <div className="flex gap-2 mt-2">
                          <div className="badge badge-primary">{selectedLocation.type} {selectedLocation.name}</div>
                        </div>
                      </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="btn btn-sm btn-ghost gap-2">
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>
                      <button className="btn btn-sm btn-ghost gap-2 text-error">
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="divider"></div>

                  <div className="space-y-6">
                    <div>
                      <h3 className="font-bold text-lg mb-2">Description</h3>
                      <p className="opacity-80">{selectedLocation.description}</p>
                    </div>

                    <div>
                      <h3 className="font-bold text-lg mb-3">Scenes at this Location</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {selectedLocation.scenes.map((scene, idx) => (
                          <div key={idx} className="p-3 bg-base-300 rounded-lg flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 opacity-60" />
                              <span className="font-semibold text-sm">{scene}</span>
                            </div>
                            <button className="btn btn-xs btn-ghost">View</button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="card bg-base-300">
                        <div className="card-body p-4">
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <Image className="w-4 h-4" />
                            Reference Images
                          </h4>
                          <button className="btn btn-sm btn-outline gap-2">
                            <Plus className="w-3 h-3" />
                            Upload
                          </button>
                        </div>
                      </div>

                      <div className="card bg-base-300">
                        <div className="card-body p-4">
                          <h4 className="font-semibold mb-2">AI Generation</h4>
                          <button className="btn btn-sm btn-primary gap-2">
                            Generate Location
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card bg-base-200 shadow-xl">
                <div className="card-body items-center text-center py-24">
                  <MapPin className="w-16 h-16 opacity-30 mb-4" />
                  <h3 className="text-xl font-bold">Select a Location</h3>
                  <p className="opacity-60 max-w-md">
                    Choose a location from the left to view its details and manage scenes
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

