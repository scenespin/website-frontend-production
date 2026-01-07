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
import { useBulkPresignedUrls } from '@/hooks/useMediaLibrary';

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
  backgrounds?: Array<{ // NEW: Backgrounds array
    id: string;
    imageUrl: string;
    s3Key: string;
    backgroundType: 'window' | 'wall' | 'doorway' | 'texture' | 'corner-detail' | 'furniture' | 'architectural-feature' | 'custom';
    sourceType?: 'reference-images' | 'angle-variations';
    sourceAngleId?: string;
    metadata?: {
      providerId?: string;
      quality?: 'standard' | 'high-quality';
    };
    timeOfDay?: string; // For grouping with angles
    weather?: string; // For grouping with angles
  }>;
  selectedAngle?: { angleId?: string; s3Key?: string; imageUrl?: string }; // KEPT for backward compat
  selectedLocationReference?: { // NEW: Unified selection (supports both angles and backgrounds)
    type?: 'angle' | 'background';
    angleId?: string;
    backgroundId?: string;
    s3Key?: string;
    imageUrl?: string;
  };
  onAngleChange: (locationId: string, angle: { angleId?: string; s3Key?: string; imageUrl?: string } | undefined) => void; // KEPT for backward compat
  onLocationReferenceChange?: (locationId: string, reference: { 
    type?: 'angle' | 'background';
    angleId?: string;
    backgroundId?: string;
    s3Key?: string;
    imageUrl?: string;
  } | undefined) => void; // NEW: Unified callback
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
  backgrounds = [], // NEW: Default to empty array
  selectedAngle, // KEPT for backward compat
  selectedLocationReference, // NEW: Unified selection
  onAngleChange, // KEPT for backward compat
  onLocationReferenceChange, // NEW: Unified callback
  isRequired = false,
  recommended,
  optOut = false,
  onOptOutChange,
  locationDescription = '',
  onLocationDescriptionChange,
  splitLayout = false
}: LocationAngleSelectorProps) {
  // Use unified selection if available, otherwise fall back to selectedAngle
  const currentSelection = selectedLocationReference || (selectedAngle ? {
    type: 'angle' as const,
    angleId: selectedAngle.angleId,
    s3Key: selectedAngle.s3Key,
    imageUrl: selectedAngle.imageUrl
  } : undefined);
  
  // Unified callback - use onLocationReferenceChange if available, otherwise onAngleChange
  const handleSelectionChange = React.useCallback((reference: {
    type?: 'angle' | 'background';
    angleId?: string;
    backgroundId?: string;
    s3Key?: string;
    imageUrl?: string;
  } | undefined) => {
    if (onLocationReferenceChange) {
      onLocationReferenceChange(locationId, reference);
    } else if (onAngleChange) {
      // Backward compat: convert to angle format
      onAngleChange(locationId, reference ? {
        angleId: reference.angleId,
        s3Key: reference.s3Key,
        imageUrl: reference.imageUrl
      } : undefined);
    }
  }, [locationId, onLocationReferenceChange, onAngleChange]);
  
  // Group both angles AND backgrounds by timeOfDay/weather (unified grouping)
  const groupedPhotos = React.useMemo(() => {
    const groups: Record<string, Array<{
      type: 'angle' | 'background';
      id?: string;
      angleId?: string;
      backgroundId?: string;
      imageUrl: string;
      s3Key: string;
      label: string;
      badge?: string; // For display (e.g., "Angle", "Background • Window")
      timeOfDay?: string;
      weather?: string;
      isBase?: boolean;
    }>> = {};
    
    // Add base reference to "Creation" group
    if (baseReference) {
      if (!groups['Creation']) groups['Creation'] = [];
      groups['Creation'].push({
        type: 'angle',
        id: undefined,
        angleId: undefined,
        imageUrl: baseReference.imageUrl,
        s3Key: baseReference.s3Key,
        label: `Base (${baseReference.angle})`,
        badge: 'Angle',
        isBase: true
      });
    }
    
    // Group angle variations by timeOfDay/weather
    angleVariations.forEach(angle => {
      // 🔥 FIX: Check if this is the base reference (creation image)
      const isBaseReference = baseReference && angle.s3Key === baseReference.s3Key;
      
      const metadataParts = [
        angle.timeOfDay ? angle.timeOfDay : null,
        angle.weather ? angle.weather : null
      ].filter(Boolean);
      
      // 🔥 FIX: If it's the base reference and has no metadata, put it in "Creation Image" group
      const groupKey = isBaseReference && metadataParts.length === 0
        ? 'Creation Image'
        : metadataParts.length > 0 
          ? metadataParts.join(' • ') 
          : 'No Metadata';
      
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push({
        type: 'angle',
        id: angle.angleId,
        angleId: angle.angleId,
        imageUrl: angle.imageUrl,
        s3Key: angle.s3Key,
        label: angle.label || angle.angle,
        badge: 'Angle',
        timeOfDay: angle.timeOfDay,
        weather: angle.weather,
        isBase: isBaseReference
      });
    });
    
    // Group backgrounds by timeOfDay/weather (same grouping logic)
    backgrounds.forEach(background => {
      const metadataParts = [
        background.timeOfDay ? background.timeOfDay : null,
        background.weather ? background.weather : null
      ].filter(Boolean);
      
      const groupKey = metadataParts.length > 0 
        ? metadataParts.join(' • ') 
        : 'No Metadata';
      
      if (!groups[groupKey]) groups[groupKey] = [];
      
      // Format background type label
      const backgroundTypeLabel = background.backgroundType
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      groups[groupKey].push({
        type: 'background',
        id: background.id,
        backgroundId: background.id,
        imageUrl: background.imageUrl,
        s3Key: background.s3Key,
        label: backgroundTypeLabel,
        badge: `Background • ${backgroundTypeLabel}${background.sourceType === 'angle-variations' ? ' (from Angle)' : ''}`,
        timeOfDay: background.timeOfDay,
        weather: background.weather,
        isBase: false
      });
    });
    
    // 🔥 FIX: If "No Metadata" group only contains the creation image (base reference), rename it to "Creation Image"
    if (groups['No Metadata'] && baseReference) {
      const noMetadataGroup = groups['No Metadata'];
      const isOnlyCreationImage = noMetadataGroup.length === 1 && 
        noMetadataGroup[0].s3Key === baseReference.s3Key;
      
      if (isOnlyCreationImage) {
        // Rename "No Metadata" to "Creation Image"
        groups['Creation Image'] = groups['No Metadata'];
        delete groups['No Metadata'];
      }
    }
    
    return groups;
  }, [baseReference, angleVariations, backgrounds]);
  
  // Get all group keys (sorted: "No Metadata" last, then alphabetically)
  // IMPORTANT: Only include "Creation" if there are NO Production Hub images
  const groupKeys = React.useMemo(() => {
    const keys = Object.keys(groupedPhotos);
    const hasProductionHubImages = keys.some(k => k !== 'Creation' && k !== 'Creation Image' && k !== 'No Metadata');
    
    // Only include Creation if it's the absolute last resort (no Production Hub images)
    const filteredKeys = hasProductionHubImages 
      ? keys.filter(k => k !== 'Creation')
      : keys;
    
    return filteredKeys.sort((a, b) => {
      if (a === 'No Metadata') return 1;
      if (b === 'No Metadata') return -1;
      if (a === 'Creation Image') return 1;
      if (b === 'Creation Image') return -1;
      if (a === 'Creation') return -1; // Creation first (only if no Production Hub)
      if (b === 'Creation') return 1;
      return a.localeCompare(b);
    });
  }, [groupedPhotos]);
  
  // Check if we're using Creation image (last resort)
  const isUsingCreationImage = React.useMemo(() => {
    const hasProductionHubImages = angleVariations.length > 0 || backgrounds.length > 0;
    return !hasProductionHubImages && !!baseReference;
  }, [angleVariations.length, backgrounds.length, baseReference]);
  
  // Selected group - sync with selected reference if it exists
  const [selectedGroup, setSelectedGroup] = React.useState<string>(() => {
    // If we have a selected reference, find which group it belongs to
    if (currentSelection) {
      // Check if it's in baseReference (Creation group)
      if (baseReference && (
        (currentSelection.s3Key && baseReference.s3Key === currentSelection.s3Key) ||
        (currentSelection.imageUrl && baseReference.imageUrl === currentSelection.imageUrl)
      )) {
        return 'Creation';
      }
      // Check all photos (angles and backgrounds)
      for (const [groupKey, photos] of Object.entries(groupedPhotos)) {
        const found = photos.find(photo => 
          (currentSelection.s3Key && photo.s3Key === currentSelection.s3Key) ||
          (currentSelection.imageUrl && photo.imageUrl === currentSelection.imageUrl) ||
          (currentSelection.angleId && photo.angleId === currentSelection.angleId) ||
          (currentSelection.backgroundId && photo.backgroundId === currentSelection.backgroundId)
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
  
  // Sync selectedGroup when currentSelection changes externally
  React.useEffect(() => {
    if (currentSelection) {
      // Find which group the selected reference belongs to
      if (baseReference && (
        (currentSelection.s3Key && baseReference.s3Key === currentSelection.s3Key) ||
        (currentSelection.imageUrl && baseReference.imageUrl === currentSelection.imageUrl)
      )) {
        if (groupKeys.includes('Creation')) {
          setSelectedGroup('Creation');
        }
        return;
      }
      // Check all photos (angles and backgrounds)
      for (const [groupKey, photos] of Object.entries(groupedPhotos)) {
        const found = photos.find(photo => 
          (currentSelection.s3Key && photo.s3Key === currentSelection.s3Key) ||
          (currentSelection.imageUrl && photo.imageUrl === currentSelection.imageUrl) ||
          (currentSelection.angleId && photo.angleId === currentSelection.angleId) ||
          (currentSelection.backgroundId && photo.backgroundId === currentSelection.backgroundId)
        );
        if (found && groupKeys.includes(groupKey)) {
          setSelectedGroup(groupKey);
          return;
        }
      }
    }
  }, [currentSelection, baseReference, groupedPhotos, groupKeys]);
  
  // Get photos (angles + backgrounds) for selected group
  const allPhotos = React.useMemo(() => {
    return groupedPhotos[selectedGroup] || [];
  }, [groupedPhotos, selectedGroup]);

  // 🔥 NEW: Collect all thumbnail S3 keys for photos
  const thumbnailS3Keys = React.useMemo(() => {
    const keys: string[] = [];
    allPhotos.forEach(photo => {
      if (photo.s3Key) {
        const thumbnailKey = photo.s3Key.replace(/\.(jpg|jpeg|png|gif|webp)$/i, '.jpg');
        keys.push(`thumbnails/${thumbnailKey}`);
      }
    });
    return keys;
  }, [allPhotos]);

  // 🔥 NEW: Fetch thumbnail URLs for all photos
  const { data: thumbnailUrlsMap } = useBulkPresignedUrls(thumbnailS3Keys, thumbnailS3Keys.length > 0);
  
  // 🔥 FIX: Fetch full image URLs on-demand when thumbnails aren't available yet
  // This prevents empty/flickering images while maintaining performance (thumbnails are still prioritized)
  const fullImageS3Keys = React.useMemo(() => {
    const keys: string[] = [];
    allPhotos.forEach(photo => {
      // Only fetch if we have an s3Key and imageUrl is empty or not a valid URL
      if (photo.s3Key && (!photo.imageUrl || (!photo.imageUrl.startsWith('http') && !photo.imageUrl.startsWith('data:')))) {
        keys.push(photo.s3Key);
      }
    });
    return keys;
  }, [allPhotos]);
  
  // Fetch full images only if thumbnails aren't loaded yet (prevents empty/flickering images)
  // This maintains performance (thumbnails are still prioritized) while ensuring images display
  const { data: fullImageUrlsMap = new Map() } = useBulkPresignedUrls(
    fullImageS3Keys,
    fullImageS3Keys.length > 0 && (!thumbnailUrlsMap || thumbnailUrlsMap.size === 0 || thumbnailUrlsMap.size < fullImageS3Keys.length * 0.3) // Fetch if no thumbnails or less than 30% loaded
  );

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

  const isSelected = (photo: typeof allPhotos[0]): boolean => {
    if (!currentSelection) return false;
    
    // Match by s3Key (most reliable)
    if (photo.s3Key && currentSelection.s3Key && photo.s3Key === currentSelection.s3Key) {
      return true;
    }
    
    // Match by imageUrl
    if (photo.imageUrl && currentSelection.imageUrl && photo.imageUrl === currentSelection.imageUrl) {
      return true;
    }
    
    // Match by angleId (for angles)
    if (photo.type === 'angle' && photo.angleId && currentSelection.angleId && photo.angleId === currentSelection.angleId) {
      return true;
    }
    
    // Match by backgroundId (for backgrounds)
    if (photo.type === 'background' && photo.backgroundId && currentSelection.backgroundId && photo.backgroundId === currentSelection.backgroundId) {
      return true;
    }
    
    return false;
  };

  const isRecommended = (photo: typeof allPhotos[0]): boolean => {
    if (!recommended || photo.type !== 'angle') return false;
    
    // Check if this angle matches the recommended one
    if (recommended.angleId && photo.angleId && recommended.angleId === photo.angleId) {
      return true;
    }
    
    // If no angleId match, check if it's the first angle (fallback recommendation)
    const anglesOnly = allPhotos.filter(p => p.type === 'angle');
    return anglesOnly.indexOf(photo) === 0;
  };

  // Controls section (left side) - Always show, even when no angles available
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
        {/* Always show opt-out checkbox if onOptOutChange is provided (even when no angles available) */}
        {onOptOutChange && (
          <label className="flex items-center gap-1.5 text-[10px] text-[#808080] cursor-pointer hover:text-[#FFFFFF] transition-colors">
            <input
              type="checkbox"
              checked={optOut}
              onChange={(e) => {
                onOptOutChange(e.target.checked);
                if (e.target.checked) {
                  // Clear selection when opting out
                  handleSelectionChange(undefined);
                }
              }}
              className="w-3 h-3 text-[#DC143C] rounded border-[#3F3F46] focus:ring-[#DC143C] focus:ring-offset-0 cursor-pointer"
            />
            <span>Don't use location image</span>
          </label>
        )}
      </div>
      
      {/* Location description prompt when opted out - REQUIRED */}
      {optOut && onLocationDescriptionChange && (
        <div className="mt-3">
          <label className="block text-[10px] text-[#808080] mb-1.5">
            Describe the background or location for this shot <span className="text-[#DC143C]">(required)</span>:
          </label>
          <textarea
            value={locationDescription}
            onChange={(e) => onLocationDescriptionChange(e.target.value)}
            placeholder="e.g., 'blurry illuminated background', 'modern office with city view', 'empty warehouse with dramatic lighting'"
            rows={2}
            className={`w-full px-3 py-2 bg-[#1A1A1A] border rounded text-xs text-[#FFFFFF] placeholder-[#808080] hover:border-[#808080] focus:outline-none transition-colors resize-none ${
              !locationDescription.trim() ? 'border-[#DC143C]' : 'border-[#3F3F46] focus:border-[#DC143C]'
            }`}
            required
          />
          <div className={`text-[10px] mt-1 ${!locationDescription.trim() ? 'text-[#DC143C]' : 'text-[#808080] italic'}`}>
            {!locationDescription.trim() 
              ? '⚠️ Location description is required when not using a location image.'
              : 'This description will be used in image and video generation prompts.'}
          </div>
        </div>
      )}
      
      {!optOut && (
        <>
          {/* Show message when no angles available */}
          {allPhotos.length === 0 && (
            <div className="p-2 bg-[#3F3F46]/30 border border-[#808080]/30 rounded text-[10px] text-[#808080]">
              No location angles or backgrounds available. Use the checkbox above to describe the location instead.
            </div>
          )}
          
          {/* Warning when using Creation image (last resort) */}
          {isUsingCreationImage && allPhotos.length > 0 && (
            <div className="p-2 bg-yellow-900/20 border border-yellow-700/50 rounded text-[10px] text-yellow-300">
              ⚠️ Using creation image (last resort). No Production Hub images available. Consider generating location angles for better results.
            </div>
          )}
          
          {/* Time of Day/Weather Group Selector (similar to outfit dropdown) - Only show if angles available AND not just Creation/No Metadata */}
          {(() => {
            // 🔥 FIX: Hide dropdown if only "Creation" and/or "No Metadata" are available
            const hasProductionHubImages = groupKeys.some(k => k !== 'Creation' && k !== 'No Metadata');
            return groupKeys.length > 1 && allPhotos.length > 0 && hasProductionHubImages;
          })() && (
            <div className="flex items-center gap-2">
              <label className="text-xs text-[#808080]">Filter by:</label>
              <select
                value={selectedGroup}
                onChange={(e) => {
                  const newGroup = e.target.value;
                  setSelectedGroup(newGroup);
                  // Only clear selection if the selected reference is not in the new group
                  if (currentSelection) {
                    const newGroupPhotos = groupedPhotos[newGroup] || [];
                    const photoInNewGroup = newGroupPhotos.find(photo =>
                      (currentSelection.s3Key && photo.s3Key === currentSelection.s3Key) ||
                      (currentSelection.imageUrl && photo.imageUrl === currentSelection.imageUrl) ||
                      (currentSelection.angleId && photo.angleId === currentSelection.angleId) ||
                      (currentSelection.backgroundId && photo.backgroundId === currentSelection.backgroundId)
                    );
                    // Only clear if the selected reference is not in the new group
                    if (!photoInNewGroup) {
                      handleSelectionChange(undefined);
                    }
                  }
                }}
                className="px-2 py-1 bg-[#1F1F1F] border border-[#3F3F46] rounded text-white text-xs focus:border-[#DC143C] focus:outline-none"
              >
                {groupKeys.map((groupKey) => {
                  const count = groupedPhotos[groupKey]?.length || 0;
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
                      {displayName} ({count} photos)
                    </option>
                  );
                })}
              </select>
            </div>
          )}
          
          {/* Optional: Show metadata for selected reference */}
          {currentSelection && (() => {
            const selected = allPhotos.find(p => isSelected(p));
            if (selected && (selected.timeOfDay || selected.weather)) {
              return (
                <div className="text-[10px] text-[#808080] mt-1">
                  {selected.timeOfDay && <span>Time: {selected.timeOfDay}</span>}
                  {selected.timeOfDay && selected.weather && <span className="mx-1">•</span>}
                  {selected.weather && <span>Weather: {selected.weather}</span>}
                  {selected.badge && <span className="mx-1">• {selected.badge}</span>}
                </div>
              );
            }
            return null;
          })()}
        </>
      )}
    </div>
  );

  // Image grid section (right side) - bigger thumbnails
  // Shows both angles AND backgrounds from selected metadata group
  const imageGridSection = !optOut ? (
    <div className="grid grid-cols-4 gap-2">
      {allPhotos.map((photo, idx) => {
        const selected = isSelected(photo);
        const isRec = isRecommended(photo);
        
        return (
          <button
            key={photo.s3Key || photo.imageUrl || `${photo.type}-${photo.id || idx}`}
            onClick={() => {
              handleSelectionChange({
                type: photo.type,
                angleId: photo.angleId,
                backgroundId: photo.backgroundId,
                s3Key: photo.s3Key,
                imageUrl: photo.imageUrl
              });
            }}
            className={`relative aspect-video bg-[#141414] rounded border-2 transition-all ${
              selected
                ? 'border-[#DC143C] ring-2 ring-[#DC143C]/50'
                : 'border-[#3F3F46] hover:border-[#808080]'
            }`}
            title={`${photo.label}${photo.timeOfDay ? ` - ${photo.timeOfDay}` : ''}${photo.weather ? ` - ${photo.weather}` : ''}`}
          >
            {photo.imageUrl || photo.s3Key ? (() => {
              // 🔥 FIX: Get thumbnail URL using locationThumbnailS3KeyMap (from useLocationReferences)
              // This matches the pattern used for characters and props
              let thumbnailS3Key: string | null = null;
              // Note: LocationAngleSelector doesn't have access to locationThumbnailS3KeyMap
              // So we'll use the pattern-based approach for now, but check if photo.imageUrl is valid
              if (photo.s3Key) {
                const thumbnailKey = `thumbnails/${photo.s3Key.replace(/\.(jpg|jpeg|png|gif|webp)$/i, '.jpg')}`;
                thumbnailS3Key = thumbnailKey;
              }
              const thumbnailUrl = thumbnailS3Key && thumbnailUrlsMap?.get(thumbnailS3Key);
              
              // 🔥 FIX: Get full image URL as fallback if thumbnail isn't available yet
              const fullImageUrl = photo.s3Key && fullImageUrlsMap?.get(photo.s3Key);
              
              // 🔥 FIX: Use imageUrl as fallback if it's already a valid presigned URL
              // The imageUrl from useLocationReferences should already be a presigned URL (or empty)
              const imageUrlFallback = photo.imageUrl && 
                                      (photo.imageUrl.startsWith('http') || photo.imageUrl.startsWith('data:'))
                                      ? photo.imageUrl 
                                      : null;
              
              // 🔥 PERFORMANCE: Use thumbnail first (fastest), then full image fallback, then imageUrl
              const displayUrl = thumbnailUrl || fullImageUrl || imageUrlFallback;
              
              // If displayUrl is empty or looks like an s3Key (not a URL), don't render image
              if (!displayUrl || (!displayUrl.startsWith('http') && !displayUrl.startsWith('data:'))) {
                return (
                  <div className="w-full h-full bg-[#1A1A1A] flex items-center justify-center text-[10px] text-[#808080] p-1 text-center rounded">
                    No image
                  </div>
                );
              }
              
              return (
                <img
                  src={displayUrl}
                  alt={photo.label}
                  className="w-full h-full object-cover"
                  style={{
                    maxWidth: '640px',
                    maxHeight: '360px' // 16:9 aspect ratio (640/1.777 = 360)
                  }}
                  loading="lazy"
                  onError={(e) => {
                    const imgElement = e.target as HTMLImageElement;
                    // Try full image if thumbnail fails
                    if (thumbnailUrl && displayUrl === thumbnailUrl && fullImageUrl && imgElement.src !== fullImageUrl) {
                      imgElement.src = fullImageUrl;
                    } else if (imageUrlFallback && imgElement.src !== imageUrlFallback) {
                      imgElement.src = imageUrlFallback;
                    } else {
                      // If all fail, hide image and show placeholder
                      imgElement.style.display = 'none';
                    }
                  }}
                />
              );
            })() : (
              <div className="w-full h-full bg-[#1A1A1A] flex items-center justify-center text-[10px] text-[#808080] p-1 text-center rounded">
                {photo.label}
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
            
            {/* Label and badge overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-1.5">
              <div className="text-[8px] text-white font-medium truncate mb-0.5">
                {photo.label}
              </div>
              {photo.badge && (
                <div className={`text-[7px] ${
                  photo.type === 'background' ? 'text-blue-300' : 'text-gray-300'
                } truncate`}>
                  {photo.badge}
                </div>
              )}
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

