'use client';

/**
 * LocationAngleSelector - Location Angle Selection for Shots
 * 
 * Phase 2: Displays grid of location angle thumbnails for user selection
 * Similar to character headshot selector but for location angles
 */

import React from 'react';
import { Check, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface LocationAngleSelectorProps {
  locationId: string;
  locationName: string;
  angleVariations: Array<{
    angleId?: string;
    angle: string;
    s3Key: string;
    imageUrl: string;
    label?: string;
    timeOfDay?: string;
    weather?: string;
  }>;
  baseReference?: {
    s3Key: string;
    imageUrl: string;
    angle: string;
  };
  selectedAngle?: { angleId?: string; s3Key?: string; imageUrl?: string };
  onAngleChange: (locationId: string, angle: { angleId?: string; s3Key?: string; imageUrl?: string } | undefined) => void;
  isRequired?: boolean;
  recommended?: { angleId?: string; reason: string };
  optOut?: boolean; // Whether user has opted out of using location image
  onOptOutChange?: (optOut: boolean) => void; // Callback when opt-out checkbox changes
  locationDescription?: string; // Description of location when optOut is true
  onLocationDescriptionChange?: (description: string) => void; // Callback when description changes
  splitLayout?: boolean; // If true, returns fragment with controls and images separate for grid layout
}

export function LocationAngleSelector({
  locationId,
  locationName,
  angleVariations,
  baseReference,
  selectedAngle,
  onAngleChange,
  isRequired = false,
  recommended,
  optOut = false,
  onOptOutChange,
  locationDescription = '',
  onLocationDescriptionChange,
  splitLayout = false
}: LocationAngleSelectorProps) {
  // Group angles by timeOfDay/weather (similar to outfit grouping)
  const groupedAngles = React.useMemo(() => {
    const groups: Record<string, Array<{
      angleId?: string;
      angle: string;
      s3Key: string;
      imageUrl: string;
      label?: string;
      timeOfDay?: string;
      weather?: string;
      isBase?: boolean;
    }>> = {};
    
    // Add base reference to "Creation" group
    if (baseReference) {
      if (!groups['Creation']) groups['Creation'] = [];
      groups['Creation'].push({
        ...baseReference,
        angleId: undefined,
        isBase: true,
        label: `Base (${baseReference.angle})`
      });
    }
    
    // Group angle variations by timeOfDay/weather
    angleVariations.forEach(angle => {
      const metadataParts = [
        angle.timeOfDay ? angle.timeOfDay : null,
        angle.weather ? angle.weather : null
      ].filter(Boolean);
      
      const groupKey = metadataParts.length > 0 
        ? metadataParts.join(' • ') 
        : 'No Metadata';
      
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push({
        ...angle,
        isBase: false,
        label: angle.label || angle.angle
      });
    });
    
    return groups;
  }, [baseReference, angleVariations]);
  
  // Get all group keys (sorted: "No Metadata" last, then alphabetically)
  // IMPORTANT: Only include "Creation" if there are NO Production Hub images
  const groupKeys = React.useMemo(() => {
    const keys = Object.keys(groupedAngles);
    const hasProductionHubImages = keys.some(k => k !== 'Creation' && k !== 'No Metadata');
    
    // Only include Creation if it's the absolute last resort (no Production Hub images)
    const filteredKeys = hasProductionHubImages 
      ? keys.filter(k => k !== 'Creation')
      : keys;
    
    return filteredKeys.sort((a, b) => {
      if (a === 'No Metadata') return 1;
      if (b === 'No Metadata') return -1;
      if (a === 'Creation') return -1; // Creation first (only if no Production Hub)
      if (b === 'Creation') return 1;
      return a.localeCompare(b);
    });
  }, [groupedAngles]);
  
  // Check if we're using Creation image (last resort)
  const isUsingCreationImage = React.useMemo(() => {
    const hasProductionHubImages = angleVariations.length > 0;
    return !hasProductionHubImages && !!baseReference;
  }, [angleVariations.length, baseReference]);
  
  // Selected group - sync with selected angle if it exists
  const [selectedGroup, setSelectedGroup] = React.useState<string>(() => {
    // If we have a selected angle, find which group it belongs to
    if (selectedAngle) {
      // Check if it's in baseReference (Creation group)
      if (baseReference && (
        (selectedAngle.s3Key && baseReference.s3Key === selectedAngle.s3Key) ||
        (selectedAngle.imageUrl && baseReference.imageUrl === selectedAngle.imageUrl)
      )) {
        return 'Creation';
      }
      // Check angleVariations
      for (const [groupKey, angles] of Object.entries(groupedAngles)) {
        const found = angles.find(angle => 
          (selectedAngle.s3Key && angle.s3Key === selectedAngle.s3Key) ||
          (selectedAngle.imageUrl && angle.imageUrl === selectedAngle.imageUrl) ||
          (selectedAngle.angleId && angle.angleId === selectedAngle.angleId)
        );
        if (found) {
          return groupKey;
        }
      }
    }
    // Prefer first Production Hub group (not "Creation")
    const productionHubGroups = groupKeys.filter(k => k !== 'Creation');
    return productionHubGroups.length > 0 ? productionHubGroups[0] : groupKeys[0] || 'Creation';
  });
  
  // Sync selectedGroup when selectedAngle changes externally
  React.useEffect(() => {
    if (selectedAngle) {
      // Find which group the selected angle belongs to
      if (baseReference && (
        (selectedAngle.s3Key && baseReference.s3Key === selectedAngle.s3Key) ||
        (selectedAngle.imageUrl && baseReference.imageUrl === selectedAngle.imageUrl)
      )) {
        if (groupKeys.includes('Creation')) {
          setSelectedGroup('Creation');
        }
        return;
      }
      // Check angleVariations
      for (const [groupKey, angles] of Object.entries(groupedAngles)) {
        const found = angles.find(angle => 
          (selectedAngle.s3Key && angle.s3Key === selectedAngle.s3Key) ||
          (selectedAngle.imageUrl && angle.imageUrl === selectedAngle.imageUrl) ||
          (selectedAngle.angleId && angle.angleId === selectedAngle.angleId)
        );
        if (found && groupKeys.includes(groupKey)) {
          setSelectedGroup(groupKey);
          return;
        }
      }
    }
  }, [selectedAngle, baseReference, groupedAngles, groupKeys]);
  
  // Get angles for selected group
  const allAngles = React.useMemo(() => {
    return groupedAngles[selectedGroup] || [];
  }, [groupedAngles, selectedGroup]);

  const getAngleLabel = (angle: string): string => {
    const labels: Record<string, string> = {
      'front': 'Front View',
      'side': 'Side View',
      'aerial': 'Aerial View',
      'interior': 'Interior',
      'exterior': 'Exterior',
      'wide': 'Wide Angle',
      'detail': 'Detail Shot',
      'corner': 'Corner View',
      'low-angle': 'Low Angle',
      'entrance': 'Entrance',
      'foreground-framing': 'Foreground Framing',
      'pov': 'Point of View',
      'atmospheric': 'Atmospheric',
      'golden-hour': 'Golden Hour',
      'back-view': 'Back View',
      'close-up': 'Close-Up',
      'establishing': 'Establishing'
    };
    return labels[angle] || angle;
  };

  const isSelected = (angle: typeof allAngles[0]): boolean => {
    if (!selectedAngle) return false;
    
    // Match by s3Key (most reliable)
    if (angle.s3Key && selectedAngle.s3Key && angle.s3Key === selectedAngle.s3Key) {
      return true;
    }
    
    // Match by imageUrl
    if (angle.imageUrl && selectedAngle.imageUrl && angle.imageUrl === selectedAngle.imageUrl) {
      return true;
    }
    
    // Match by angleId
    if (angle.angleId && selectedAngle.angleId && angle.angleId === selectedAngle.angleId) {
      return true;
    }
    
    return false;
  };

  const isRecommended = (angle: typeof allAngles[0]): boolean => {
    if (!recommended) return false;
    
    // Check if this angle matches the recommended one
    if (recommended.angleId && angle.angleId && recommended.angleId === angle.angleId) {
      return true;
    }
    
    // If no angleId match, check if it's the first angle (fallback recommendation)
    return allAngles.indexOf(angle) === 0;
  };

  if (allAngles.length === 0) {
    return (
      <div className="text-xs text-[#808080] p-3 bg-[#0A0A0A] border border-[#3F3F46] rounded-lg">
        No location angles available
      </div>
    );
  }

  // Controls section (left side)
  const controlsSection = (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 text-xs font-medium text-[#808080]">
          <MapPin className="w-3 h-3" />
          <span>{locationName}</span>
        </div>
        {isRequired && (
          <Badge variant="outline" className="border-[#DC143C] text-[#DC143C] text-[10px]">
            Required
          </Badge>
        )}
        {isRequired && onOptOutChange && (
          <label className="flex items-center gap-1.5 text-[10px] text-[#808080] cursor-pointer hover:text-[#FFFFFF] transition-colors">
            <input
              type="checkbox"
              checked={optOut}
              onChange={(e) => {
                onOptOutChange(e.target.checked);
                if (e.target.checked) {
                  // Clear selection when opting out
                  onAngleChange(locationId, undefined);
                }
              }}
              className="w-3 h-3 text-[#DC143C] rounded border-[#3F3F46] focus:ring-[#DC143C] focus:ring-offset-0 cursor-pointer"
            />
            <span>Don't use location image</span>
          </label>
        )}
      </div>
      
      {/* Location description prompt when opted out */}
      {optOut && onLocationDescriptionChange && (
        <div className="mt-3">
          <label className="block text-[10px] text-[#808080] mb-1.5">
            Describe the background or location for this shot (optional):
          </label>
          <textarea
            value={locationDescription}
            onChange={(e) => onLocationDescriptionChange(e.target.value)}
            placeholder="e.g., 'blurry illuminated background', 'modern office with city view', 'empty warehouse with dramatic lighting'"
            rows={2}
            className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#3F3F46] rounded text-xs text-[#FFFFFF] placeholder-[#808080] hover:border-[#808080] focus:border-[#DC143C] focus:outline-none transition-colors resize-none"
          />
          <div className="text-[10px] text-[#808080] italic mt-1">
            {locationDescription.trim() 
              ? 'This description will be used in image and video generation prompts.'
              : 'If left empty, the model will predict the background based on the scene context.'}
          </div>
        </div>
      )}
      
      {!optOut && (
        <>
          {/* Warning when using Creation image (last resort) */}
          {isUsingCreationImage && (
            <div className="p-2 bg-yellow-900/20 border border-yellow-700/50 rounded text-[10px] text-yellow-300">
              ⚠️ Using creation image (last resort). No Production Hub images available. Consider generating location angles for better results.
            </div>
          )}
          
          {/* Time of Day/Weather Group Selector (similar to outfit dropdown) */}
          {groupKeys.length > 1 && (
            <div className="flex items-center gap-2">
              <label className="text-xs text-[#808080]">Filter by:</label>
              <select
                value={selectedGroup}
                onChange={(e) => {
                  const newGroup = e.target.value;
                  setSelectedGroup(newGroup);
                  // Only clear selection if the selected angle is not in the new group
                  if (selectedAngle) {
                    const newGroupAngles = groupedAngles[newGroup] || [];
                    const angleInNewGroup = newGroupAngles.find(angle =>
                      (selectedAngle.s3Key && angle.s3Key === selectedAngle.s3Key) ||
                      (selectedAngle.imageUrl && angle.imageUrl === selectedAngle.imageUrl) ||
                      (selectedAngle.angleId && angle.angleId === selectedAngle.angleId)
                    );
                    // Only clear if the selected angle is not in the new group
                    if (!angleInNewGroup) {
                      onAngleChange(locationId, undefined);
                    }
                  }
                }}
                className="px-2 py-1 bg-[#1F1F1F] border border-[#3F3F46] rounded text-white text-xs focus:border-[#DC143C] focus:outline-none"
              >
                {groupKeys.map((groupKey) => {
                  const count = groupedAngles[groupKey]?.length || 0;
                  let displayName: string;
                  if (groupKey === 'Creation') {
                    displayName = 'Creation Image';
                  } else if (groupKey === 'No Metadata') {
                    displayName = 'No Metadata';
                  } else {
                    displayName = groupKey
                      .split(' • ')
                      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
                      .join(' • ');
                  }
                  return (
                    <option key={groupKey} value={groupKey}>
                      {displayName} ({count})
                    </option>
                  );
                })}
              </select>
            </div>
          )}
          
          {/* Optional: Show metadata for selected angle */}
          {selectedAngle && (() => {
            const selected = allAngles.find(a => isSelected(a));
            if (selected && (selected.timeOfDay || selected.weather)) {
              return (
                <div className="text-[10px] text-[#808080] mt-1">
                  {selected.timeOfDay && <span>Time: {selected.timeOfDay}</span>}
                  {selected.timeOfDay && selected.weather && <span className="mx-1">•</span>}
                  {selected.weather && <span>Weather: {selected.weather}</span>}
                </div>
              );
            }
            return null;
          })()}
        </>
      )}
    </div>
  );

  // Image grid section (right side)
  const imageGridSection = !optOut ? (
    <div className="grid grid-cols-6 gap-1.5">
      {allAngles.map((angle, idx) => {
        const selected = isSelected(angle);
        const isRec = isRecommended(angle);
        
        return (
          <button
            key={angle.s3Key || angle.imageUrl || `${angle.angle}-${idx}`}
            onClick={() => {
              onAngleChange(locationId, {
                angleId: angle.angleId,
                s3Key: angle.s3Key,
                imageUrl: angle.imageUrl
              });
            }}
            className={`relative aspect-square rounded border-2 transition-all ${
              selected
                ? 'border-[#DC143C] ring-2 ring-[#DC143C]/50'
                : 'border-[#3F3F46] hover:border-[#808080]'
            }`}
            title={`${getAngleLabel(angle.angle)}${angle.timeOfDay ? ` - ${angle.timeOfDay}` : ''}${angle.weather ? ` - ${angle.weather}` : ''}`}
          >
            {angle.imageUrl ? (
              <img
                src={angle.imageUrl}
                alt={angle.label || getAngleLabel(angle.angle)}
                className="w-full h-full object-cover rounded"
              />
            ) : (
              <div className="w-full h-full bg-[#1A1A1A] flex items-center justify-center text-[10px] text-[#808080] p-1 text-center rounded">
                {angle.label || getAngleLabel(angle.angle)}
              </div>
            )}
            
            {selected && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#DC143C]/20">
                <Check className="w-4 h-4 text-[#DC143C]" />
              </div>
            )}
            
            {isRec && !selected && (
              <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-[#DC143C]/80 text-[8px] text-white rounded">
                Recommended
              </div>
            )}
            
            {/* Angle label overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1">
              <div className="text-[8px] text-white font-medium truncate">
                {getAngleLabel(angle.angle)}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  ) : null;

  // If splitLayout, return fragment for grid positioning
  if (splitLayout) {
    return (
      <>
        {controlsSection}
        {imageGridSection}
      </>
    );
  }

  // Otherwise, return single column layout
  return (
    <div className="space-y-2">
      {controlsSection}
      {imageGridSection}
    </div>
  );
}

