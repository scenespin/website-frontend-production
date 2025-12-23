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
}

export function LocationAngleSelector({
  locationId,
  locationName,
  angleVariations,
  baseReference,
  selectedAngle,
  onAngleChange,
  isRequired = false,
  recommended
}: LocationAngleSelectorProps) {
  // Combine base reference with angle variations for display
  const allAngles = React.useMemo(() => {
    const angles: Array<{
      angleId?: string;
      angle: string;
      s3Key: string;
      imageUrl: string;
      label?: string;
      timeOfDay?: string;
      weather?: string;
      isBase?: boolean;
    }> = [];
    
    // Add base reference if available
    if (baseReference) {
      angles.push({
        ...baseReference,
        angleId: undefined,
        isBase: true,
        label: `Base (${baseReference.angle})`
      });
    }
    
    // Add angle variations
    angleVariations.forEach(angle => {
      angles.push({
        ...angle,
        isBase: false,
        label: angle.label || angle.angle
      });
    });
    
    return angles;
  }, [baseReference, angleVariations]);

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

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-medium text-[#808080]">
          <MapPin className="w-3 h-3" />
          <span>{locationName}</span>
        </div>
        {isRequired && (
          <Badge variant="outline" className="border-[#DC143C] text-[#DC143C] text-[10px]">
            Required
          </Badge>
        )}
      </div>
      
      <div className="grid grid-cols-8 gap-1.5">
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
    </div>
  );
}

