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
import { resolveImageUrl, isValidImageUrl } from './utils/imageUrlResolver';
import { SCENE_BUILDER_GRID_COLS, SCENE_BUILDER_GRID_GAP, THUMBNAIL_STYLE } from './utils/imageConstants';

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
  // 🔥 NEW: Location URL maps for proper image resolution (same pattern as character headshots)
  locationThumbnailS3KeyMap?: Map<string, string>; // Map of s3Key -> thumbnailS3Key
  locationThumbnailUrlsMap?: Map<string, string>; // Map of thumbnailS3Key -> presigned URL
  locationFullImageUrlsMap?: Map<string, string>; // Map of s3Key -> full image presigned URL
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
  splitLayout = false,
  locationThumbnailS3KeyMap, // 🔥 NEW: Location URL maps
  locationThumbnailUrlsMap,
  locationFullImageUrlsMap
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
    
    // 🔥 FIX: Track which s3Keys are already added to avoid duplication
    const addedS3Keys = new Set<string>();
    
    // Group angle variations by timeOfDay/weather FIRST
    // This ensures baseReference that's also in angleVariations gets grouped correctly
    angleVariations.forEach(angle => {
      // Check if this is the base reference (creation image)
      const isBaseReference = baseReference && angle.s3Key === baseReference.s3Key;
      
      const metadataParts = [
        angle.timeOfDay ? angle.timeOfDay : null,
        angle.weather ? angle.weather : null
      ].filter(Boolean);
      
      // 🔥 FIX: If it's the base reference and has no metadata, put it in "Creation Image" group
      // Otherwise use metadata or "No Metadata"
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
      
      addedS3Keys.add(angle.s3Key);
    });
    
    // 🔥 FIX: Only add baseReference to "Creation Image" group if it's NOT already in angleVariations
    // This prevents duplication - baseReference should only appear once
    if (baseReference && !addedS3Keys.has(baseReference.s3Key)) {
      if (!groups['Creation Image']) groups['Creation Image'] = [];
      groups['Creation Image'].push({
        type: 'angle',
        id: undefined,
        angleId: undefined,
        imageUrl: baseReference.imageUrl,
        s3Key: baseReference.s3Key,
        label: `Base (${baseReference.angle})`,
        badge: 'Angle',
        isBase: true
      });
      addedS3Keys.add(baseReference.s3Key);
    }
    
    // Group backgrounds by timeOfDay/weather, or "Extreme close-ups" for ECU (metadata.useCase)
    const EXTREME_CLOSE_UPS_GROUP = 'Extreme close-ups';
    backgrounds.forEach(background => {
      const isExtremeCloseUp = (background as any).metadata?.useCase === 'extreme-closeup';
      const metadataParts = [
        background.timeOfDay ? background.timeOfDay : null,
        background.weather ? background.weather : null
      ].filter(Boolean);
      
      const groupKey = isExtremeCloseUp
        ? EXTREME_CLOSE_UPS_GROUP
        : metadataParts.length > 0
          ? metadataParts.join(' • ')
          : 'No Metadata';
      
      if (!groups[groupKey]) groups[groupKey] = [];
      
      // Format background type label (with null check)
      const backgroundTypeLabel = background.backgroundType
        ? background.backgroundType
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
        : 'Background'; // Default label if backgroundType is missing
      
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
        groups['Creation Image'] = groups['Creation Image'] || [];
        groups['Creation Image'].push(...groups['No Metadata']);
        delete groups['No Metadata'];
      }
    }
    
    // 🔥 FIX: Merge "Creation" and "Creation Image" into a single "Creation Image" group
    if (groups['Creation'] && groups['Creation Image']) {
      groups['Creation Image'].push(...groups['Creation']);
      delete groups['Creation'];
    } else if (groups['Creation']) {
      // Rename "Creation" to "Creation Image" for consistency
      groups['Creation Image'] = groups['Creation'];
      delete groups['Creation'];
    }
    
    return groups;
  }, [baseReference, angleVariations, backgrounds]);
  
  // Get all group keys (sorted: "No Metadata" last, then alphabetically)
  // 🔥 SIMPLIFIED: Always include "Creation Image" - user selects what they want
  const groupKeys = React.useMemo(() => {
    const keys = Object.keys(groupedPhotos);
    
    // Always include all groups (including Creation Image) - no filtering
    return keys.sort((a, b) => {
      if (a === 'No Metadata') return 1;
      if (b === 'No Metadata') return -1;
      if (a === 'Creation Image') return 1; // Creation Image last
      if (b === 'Creation Image') return -1;
      if (a === 'Extreme close-ups') return -1; // Before No Metadata
      if (b === 'Extreme close-ups') return 1;
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
      // Check if it's in baseReference (Creation Image group)
      if (baseReference && (
        (currentSelection.s3Key && baseReference.s3Key === currentSelection.s3Key) ||
        (currentSelection.imageUrl && baseReference.imageUrl === currentSelection.imageUrl)
      )) {
        return 'Creation Image';
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
    // Prefer first Production Hub group (not "Creation Image")
    const productionHubGroups = groupKeys.filter(k => k !== 'Creation Image');
    return productionHubGroups.length > 0 ? productionHubGroups[0] : groupKeys[0] || 'Creation Image';
  });
  
  // Sync selectedGroup when currentSelection changes externally
  React.useEffect(() => {
    if (currentSelection) {
      // Find which group the selected reference belongs to
      if (baseReference && (
        (currentSelection.s3Key && baseReference.s3Key === currentSelection.s3Key) ||
        (currentSelection.imageUrl && baseReference.imageUrl === currentSelection.imageUrl)
      )) {
        if (groupKeys.includes('Creation Image')) {
          setSelectedGroup('Creation Image');
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

  // 🔥 FIX: Memoize displayUrl calculation per photo so React detects when URLs become available
  // This ensures images update automatically when thumbnailUrlsMap gets populated
  // Use the actual map references (not memoized versions) so React detects when they change
  const photoDisplayUrls = React.useMemo(() => {
    const urls = new Map<string, string | null>();
    allPhotos.forEach(photo => {
      if (photo.s3Key || photo.imageUrl) {
        const displayUrl = resolveImageUrl({
          s3Key: photo.s3Key || null,
          thumbnailS3KeyMap: locationThumbnailS3KeyMap,
          thumbnailUrlsMap: locationThumbnailUrlsMap || new Map(), // Use actual map reference
          fullImageUrlsMap: locationFullImageUrlsMap || new Map(), // Use actual map reference
          fallbackImageUrl: photo.imageUrl
        });
        urls.set(photo.s3Key || photo.angleId || photo.backgroundId || '', displayUrl);
      }
    });
    return urls;
  }, [
    allPhotos,
    locationThumbnailS3KeyMap,
    locationThumbnailS3KeyMap?.size ?? 0,
    locationThumbnailUrlsMap, // Use actual map reference
    locationThumbnailUrlsMap?.size ?? 0, // Include size to detect when map gets populated
    locationFullImageUrlsMap, // Use actual map reference
    locationFullImageUrlsMap?.size ?? 0 // Include size to detect when map gets populated
  ]);

  // 🔥 SIMPLIFIED: Just use the provided maps directly (same pattern as characters)
  // No need to fetch our own URLs - parent component already provides them via useLocationReferences hook
  // This matches the working character headshot pattern exactly
  // 🔥 FIX: Create new Map reference when size changes so React detects updates
  // This ensures images re-render when thumbnail URLs become available
  const thumbnailUrlsMap = React.useMemo(() => {
    if (!locationThumbnailUrlsMap || locationThumbnailUrlsMap.size === 0) {
      return new Map<string, string>();
    }
    // Create new Map to ensure React detects the change
    return new Map(locationThumbnailUrlsMap);
  }, [locationThumbnailUrlsMap, locationThumbnailUrlsMap?.size ?? 0]);
  
  const fullImageUrlsMap = React.useMemo(() => {
    if (!locationFullImageUrlsMap || locationFullImageUrlsMap.size === 0) {
      return new Map<string, string>();
    }
    // Create new Map to ensure React detects the change
    return new Map(locationFullImageUrlsMap);
  }, [locationFullImageUrlsMap, locationFullImageUrlsMap?.size ?? 0]);

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
          
          {/* Time of Day/Weather Group Selector (similar to outfit dropdown) - Only show if angles available AND not just Creation Image/No Metadata */}
          {(() => {
            // 🔥 FIX: Hide dropdown if only "Creation Image" and/or "No Metadata" are available
            const hasProductionHubImages = groupKeys.some(k => k !== 'Creation Image' && k !== 'No Metadata');
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
                  if (groupKey === 'Creation Image') {
                    displayName = 'Creation Image';
                  } else if (groupKey === 'No Metadata') {
                    displayName = 'No Metadata';
                  } else if (groupKey === 'Extreme close-ups') {
                    displayName = 'Extreme close-ups';
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
    <div className={`grid ${SCENE_BUILDER_GRID_COLS} ${SCENE_BUILDER_GRID_GAP}`}>
      {allPhotos.map((photo, idx) => {
        const selected = isSelected(photo);
        const isRec = isRecommended(photo);
        
        return (
          <button
            key={photo.s3Key || photo.imageUrl || `${photo.type}-${photo.id || idx}`}
            onClick={() => {
              // 🔥 FIX: Always trigger callback, even if already selected
              // This ensures the parent state updates and the reference section refreshes
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
              // 🔥 FIX: Use memoized displayUrl so React detects when URLs become available
              const photoKey = photo.s3Key || photo.angleId || photo.backgroundId || '';
              const displayUrl = photoDisplayUrls.get(photoKey) || null;
              
              // 🔥 DEBUG: Log URL resolution for first few photos to diagnose angle vs background difference
              const isDebugPhoto = idx < 3;
              if (isDebugPhoto) {
                const hasThumbnailS3Key = photo.s3Key && locationThumbnailS3KeyMap?.has(photo.s3Key);
                const thumbnailS3Key = hasThumbnailS3Key ? locationThumbnailS3KeyMap.get(photo.s3Key) : null;
                const hasThumbnailUrl = thumbnailS3Key && thumbnailUrlsMap?.has(thumbnailS3Key);
                const hasFullImageUrl = photo.s3Key && fullImageUrlsMap?.has(photo.s3Key);
                console.log(`[LocationAngleSelector] ${photo.type} ${idx} (${photo.label}):`, {
                  s3Key: photo.s3Key?.substring(0, 50),
                  imageUrl: photo.imageUrl,
                  hasThumbnailS3Key,
                  thumbnailS3Key: thumbnailS3Key?.substring(0, 50),
                  hasThumbnailUrl,
                  thumbnailUrlsMapSize: thumbnailUrlsMap.size,
                  locationThumbnailS3KeyMapSize: locationThumbnailS3KeyMap?.size || 0,
                  locationThumbnailUrlsMapSize: locationThumbnailUrlsMap?.size || 0,
                  hasFullImageUrl,
                  fullImageUrlsMapSize: fullImageUrlsMap.size,
                  displayUrl: displayUrl ? displayUrl.substring(0, 50) + '...' : 'NULL',
                  fromMemoizedMap: photoDisplayUrls.has(photoKey)
                });
              }
              
              // 🔥 FIX: Only show loading if we have an s3Key but displayUrl is still null
              // This ensures we show loading only when we're actually waiting for URLs to load
              // Once displayUrl resolves, it will automatically display (no need for loading state)
              const isLoading = photo.s3Key && !displayUrl;
              
              // 🔥 FIX: Use displayUrl in key so React re-renders when URL becomes available
              // Include map sizes to force re-render when maps get populated
              const displayUrlHash = displayUrl ? displayUrl.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '') : 'no-url';
              const imageKey = `${photoKey}-${displayUrlHash}-${thumbnailUrlsMap.size}-${fullImageUrlsMap.size}`;
              
              // If we have a displayUrl, render the image (even if it was null before, React will re-render when it becomes available)
              if (displayUrl) {
                return (
                  <img
                    key={imageKey}
                    src={displayUrl}
                    alt={photo.label}
                    className="w-full h-full object-cover"
                    style={THUMBNAIL_STYLE}
                    loading="eager"
                    onError={(e) => {
                      // 🔥 Feature 0200: Only try full image if thumbnail failed - don't fall back to expired photo.imageUrl
                      const imgElement = e.target as HTMLImageElement;
                      const currentSrc = imgElement.src;
                      
                      // If thumbnail failed, try full image URL (from presigned URL map)
                      if (photo.s3Key && fullImageUrlsMap?.has(photo.s3Key)) {
                        const fullUrl = fullImageUrlsMap.get(photo.s3Key);
                        if (fullUrl && fullUrl !== currentSrc && isValidImageUrl(fullUrl)) {
                          imgElement.src = fullUrl;
                          return;
                        }
                      }
                      
                      // Hide broken image - no fallback to expired photo.imageUrl
                      imgElement.style.display = 'none';
                    }}
                  />
                );
              }
              
              // If no displayUrl yet, show loading state only if we have an s3Key (meaning we're waiting for URLs)
              // Otherwise show "No image" if there's no s3Key at all
              return (
                <div className="w-full h-full bg-[#1A1A1A] flex items-center justify-center text-[10px] text-[#808080] p-1 text-center rounded">
                  {isLoading ? 'Loading...' : 'No image'}
                </div>
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

